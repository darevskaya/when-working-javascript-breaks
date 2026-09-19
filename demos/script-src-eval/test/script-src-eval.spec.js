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

const values = (page) => page.locator('.summary dd').allTextContents();

test('the templates render under unsafe-eval', async ({ page }) => {
  await page.goto('/demo/script-src-eval/unsafe-eval-allowed');
  await expect(page.locator('.summary dd')).toHaveText([
    '2',
    '$52.00',
    'Free',
    '$52.00',
  ]);
  expect(await page.evaluate(() => window.cspViolations)).toEqual([]);
  await page.screenshot({ path: 'test-results/summary-permissive.png' });

  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test('script-src self blocks eval, and the raw templates stay', async ({
  page,
}) => {
  const error = page.waitForEvent('pageerror');
  await page.goto('/demo/script-src-eval/eval-blocked');
  expect((await error).name).toBe('EvalError');
  await expect
    .poll(() => page.evaluate(() => window.cspViolations))
    .toContainEqual({ directive: 'script-src', blocked: 'eval' });
  // The first template throws, so no value renders.
  for (const value of await values(page)) expect(value).toMatch(/\{\{.+\}\}/);
  await page.screenshot({ path: 'test-results/summary-restricted.png' });
});

test('the webpack bundle has a clean source, but the build adds eval', async ({
  page,
}) => {
  const error = page.waitForEvent('pageerror');
  await page.goto('/demo/script-src-eval/eval-source-map-bundle');
  expect((await error).name).toBe('EvalError');
  await expect
    .poll(() => page.evaluate(() => window.cspViolations))
    .toContainEqual({ directive: 'script-src', blocked: 'eval' });
  for (const value of await values(page)) expect(value).toMatch(/\{\{.+\}\}/);
  await page.screenshot({ path: 'test-results/summary-bundle.png' });
});
