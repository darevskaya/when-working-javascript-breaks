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

test('escaped values are still a string, so Trusted Types blocks them', async ({
  page,
}) => {
  const error = page.waitForEvent('pageerror');
  await page.goto('/demo/trusted-types/escaped-string');
  expect((await error).name).toBe('TypeError');
  expect((await error).message).toMatch(/innerHTML.*TrustedHTML/);
  await expect
    .poll(() => page.evaluate(() => window.cspViolations))
    .toContainEqual({
      directive: 'require-trusted-types-for',
      blocked: 'trusted-types-sink',
    });
  // The shop still renders. Only the widget's part of the page is missing.
  await expect(page.getByRole('heading', { name: 'Your order' })).toBeVisible();
  await expect(page.getByText('Loading sign-in…')).toBeVisible();
  await expect(page.getByRole('button')).toHaveCount(0);
  await page.screenshot({ path: 'test-results/widget-escaped.png' });
});

test('the policy widget keeps innerHTML and works under Trusted Types', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error));
  await page.goto('/demo/trusted-types/named-policy');
  const widget = page.getByRole('region', { name: 'Sign in' });
  // The html tag escaped the & in the shop name, and the page shows it as &.
  await expect(
    widget.getByRole('heading', { name: 'Sign in to Fern & Co.' }),
  ).toBeVisible();
  await page.screenshot({ path: 'test-results/widget-policy.png' });
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
  await page.screenshot({ path: 'test-results/widget-mobile.png' });
});

test('a CSP that does not name the policy stops the policy widget', async ({
  page,
}) => {
  const error = page.waitForEvent('pageerror');
  await page.goto('/demo/trusted-types/policy-not-allowed');
  expect((await error).name).toBe('TypeError');
  expect((await error).message).toMatch(/orbit-widget/);
  await expect
    .poll(() => page.evaluate(() => window.cspViolations))
    .toContainEqual(expect.objectContaining({ directive: 'trusted-types' }));
  await expect(page.getByText('Loading sign-in…')).toBeVisible();
});
