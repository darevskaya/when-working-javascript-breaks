import { test, expect } from '@playwright/test';
import { watchViolations, attachViolations } from './violations.js';

// One page, served with the policy of the current configuration.
const pagePath = '/demo/worker-src-blob/blob-allowed';

let sentPolicy;

test.beforeEach(async ({ page }, testInfo) => {
  const { csp } = testInfo.project.use;
  sentPolicy = null;

  // Replace the header the server sent. Playwright fetches the response, puts
  // the policy of this configuration on it, and gives it to the browser.
  await page.route('**/demo/worker-src-blob/**', async (route) => {
    const response = await route.fetch();
    const headers = { ...response.headers(), 'content-security-policy': csp };
    sentPolicy = headers['content-security-policy'];
    await route.fulfill({ response, headers });
  });

  await watchViolations(page);
});

test.afterEach(async ({ page }, testInfo) => {
  await attachViolations(page, testInfo);
});

test('the Blob worker renders the fractal', async ({ page }, testInfo) => {
  await page.goto(pagePath);
  expect(sentPolicy).toBe(testInfo.project.use.csp);

  await expect(page.locator('#status')).toHaveText('Render complete');
  await expect(page.getByRole('progressbar')).toHaveJSProperty('value', 100);
});
