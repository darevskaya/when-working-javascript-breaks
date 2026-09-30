import { test, expect } from '@playwright/test';
import { addPolicy, attachReports, recordReports } from './policy.js';

const pagePath = '/demo/playwright-policies/iframe';
const framedPath = '/demo/playwright-policies/framed';

test.beforeEach(async ({ page }, testInfo) => {
  await addPolicy(page, framedPath, testInfo.project.use.csp);
  await recordReports(page);
});

test.afterEach(async ({ page }, testInfo) => {
  await attachReports(page, testInfo);
});

test('the page loads inside the iframe under the policy of this project', async ({
  page,
}, testInfo) => {
  test.fail(
    testInfo.project.name === 'strict',
    "frame-ancestors 'none' refuses the page inside an iframe.",
  );
  await page.goto(pagePath);
  await expect(page.locator('#iframe-status')).toContainText(
    'The page loaded inside the iframe.',
  );
});
