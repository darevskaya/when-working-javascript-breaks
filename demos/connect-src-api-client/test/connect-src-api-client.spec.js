import { test, expect } from '@playwright/test';
import { recordViolations } from '../../common/test-helpers.js';

test('the browser allows the contract origin and blocks the rest', async ({
  page,
}) => {
  await recordViolations(page);
  await page.goto('/demo/connect-src-api-client/api-calls');
  // Through the API client and config: allowed.
  await expect(page.locator('#profile')).toHaveText('Loaded: Elena');
  // Through the API client, but the origin is not in the contract.
  await expect(page.locator('#metrics')).toHaveText('Blocked (TypeError)');
  // A hard-coded URL to a contract origin: the browser allows it. Only lint
  // sees the problem.
  await expect(page.locator('#status-check')).toHaveText('ok');
  // A direct fetch to an origin outside the contract.
  await expect(page.locator('#ping')).toHaveText('Blocked (TypeError)');
  const violations = await page.evaluate(() => window.cspViolations);
  expect(violations.map((violation) => violation.directive)).toEqual([
    'connect-src',
    'connect-src',
  ]);
  await page.screenshot({ path: 'test-results/api-calls.png' });

  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
