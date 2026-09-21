import { test, expect } from '@playwright/test';
import { recordViolations } from '../../common/test-helpers.js';

test.beforeEach(({ page }) => recordViolations(page));

const worker = (page) => page.locator('#worker-status');
const geolocation = (page) => page.locator('#geolocation-status');
const reports = (page) => page.locator('#reports li');

test('both features work when the headers allow them', async ({ page }) => {
  await page.goto('/demo/playwright-policies/allowed');
  await expect(worker(page)).toHaveText(
    'The worker replied: Hello, Playwright.',
  );
  await expect(geolocation(page)).toHaveText(
    'The permissions policy allows geolocation.',
  );
  await expect(page.locator('#reports-empty')).toBeVisible();
  expect(await page.evaluate(() => window.cspViolations)).toEqual([]);
  await page.screenshot({ path: 'test-results/policies-allowed.png' });

  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test('both features stop when the headers block them', async ({ page }) => {
  await page.goto('/demo/playwright-policies/blocked');
  await expect(worker(page)).toContainText(
    'The browser refused the worker: worker-src blocked blob:',
  );
  await expect(worker(page)).toHaveClass('blocked');
  await expect(geolocation(page)).toHaveText(
    'The permissions policy blocks geolocation.',
  );
  await expect
    .poll(() => page.evaluate(() => window.cspViolations))
    .toContainEqual({ directive: 'worker-src', blocked: 'blob' });
  await page.screenshot({ path: 'test-results/policies-blocked.png' });
});

test('the page lists one report of each kind', async ({ page }) => {
  await page.goto('/demo/playwright-policies/blocked');
  // The browser writes one csp-violation report and one
  // permissions-policy-violation report, and the page shows both.
  await expect(reports(page)).toContainText([
    /csp-violation: worker-src blocked blob/,
    /permissions-policy-violation: geolocation/,
  ]);
  await expect(page.locator('#reports-empty')).toBeHidden();
  const kinds = await page.evaluate(() =>
    window.reports.map((report) => report.type),
  );
  expect(new Set(kinds)).toEqual(
    new Set(['csp-violation', 'permissions-policy-violation']),
  );
});
