import { test, expect } from '@playwright/test';

// The page collects every report in window.reports through a
// ReportingObserver, so the tests read that one list and not the
// securitypolicyviolation event as well.
const reported = (page) =>
  page.evaluate(() => window.reports.map((report) => report.type));

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
  expect(await reported(page)).toEqual([]);
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
    'The browser refused the worker: worker-src blocked blob',
  );
  await expect(worker(page)).toHaveClass('blocked');
  await expect(geolocation(page)).toHaveText(
    'The permissions policy blocks geolocation.',
  );
  await expect.poll(() => reported(page)).toContain('csp-violation');
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
  expect(new Set(await reported(page))).toEqual(
    new Set(['csp-violation', 'permissions-policy-violation']),
  );
});
