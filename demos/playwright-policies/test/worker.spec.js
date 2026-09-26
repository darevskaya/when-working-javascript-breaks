import { test, expect } from '@playwright/test';
import { usePolicy } from './policy.js';

const pagePath = '/demo/playwright-policies/worker';

usePolicy(pagePath);

test('the worker runs under the policy of this project', async ({ page }) => {
  await page.goto(pagePath);
  await expect(page.locator('#worker-status')).toContainText(
    'The worker replied: Hello, Playwright.',
  );
});
