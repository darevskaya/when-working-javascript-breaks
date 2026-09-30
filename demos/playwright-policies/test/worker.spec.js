import { test, expect } from '@playwright/test';
import { addPolicy, attachReports, recordReports } from './policy.js';

const pagePath = '/demo/playwright-policies/worker';

test.beforeEach(async ({ page }, testInfo) => {
  await addPolicy(page, pagePath, testInfo.project.use.csp);
  await recordReports(page);
});

test.afterEach(async ({ page }, testInfo) => {
  await attachReports(page, testInfo);
});

test('the worker runs under the policy of this project', async ({ page }) => {
  await page.goto(pagePath);
  await expect(page.locator('#worker-status')).toContainText(
    'The worker replied: Hello, Playwright.',
  );
});
