import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.cspViolations = [];
    document.addEventListener('securitypolicyviolation', (event) => {
      window.cspViolations.push({
        directive: event.effectiveDirective,
        blocked: event.blockedURI,
      });
    });
  });
});

test('the widget renders and signs in on a shop with no policy', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error));
  await page.goto('/demo/sdk/permissive');
  const widget = page.getByRole('region', { name: 'Sign in' });
  await expect(
    widget.getByRole('heading', { name: 'Sign in to Fern & Co.' }),
  ).toBeVisible();
  await expect(page.getByText('Loading sign-in…')).toHaveCount(0);
  await page.screenshot({ path: 'test-results/sdk-permissive.png' });

  await widget.getByRole('button', { name: 'Continue with Orbit ID' }).click();
  await expect(
    widget.getByRole('heading', { name: 'Signed in as Elena' }),
  ).toBeVisible();
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => window.cspViolations)).toEqual([]);

  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: 'test-results/sdk-mobile.png' });
});

test('Trusted Types stops the widget at its innerHTML assignment', async ({
  page,
}) => {
  const error = page.waitForEvent('pageerror');
  await page.goto('/demo/sdk/restricted');
  expect((await error).name).toBe('TypeError');
  expect((await error).message).toMatch(/innerHTML.*TrustedHTML/);
  await expect
    .poll(() => page.evaluate(() => window.cspViolations))
    .toContainEqual({
      directive: 'require-trusted-types-for',
      blocked: 'trusted-types-sink',
    });
  // The shop still renders. Only the SDK's part of the page is missing.
  await expect(page.getByRole('heading', { name: 'Your order' })).toBeVisible();
  await expect(page.getByText('Loading sign-in…')).toBeVisible();
  await expect(page.getByRole('button')).toHaveCount(0);
  await page.screenshot({ path: 'test-results/sdk-restricted.png' });
});
