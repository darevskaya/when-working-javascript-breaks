import { test, expect } from '@playwright/test';
import { usePolicy } from './policy.js';

const pagePath = '/demo/playwright-policies/iframe';
const framedPath = '/demo/playwright-policies/framed';

usePolicy(framedPath);

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
