import { test, expect } from '@playwright/test';
import { recordViolations } from '../../common/test-helpers.js';
import { config } from '../config.js';

test.beforeEach(({ page }) => recordViolations(page));

test('the policy from config.js allows the worker the client starts', async ({
  page,
}) => {
  await page.goto('/demo/worker-src-eslint/from-config');
  await expect(page.locator('#script')).toHaveText(config.workerScript);
  await expect(page.locator('#total')).toHaveText('Total: 42.50');
  await expect(page.locator('#status')).toHaveText('ok');
  expect(await page.evaluate(() => window.cspViolations)).toEqual([]);
  await page.screenshot({ path: 'test-results/from-config.png' });

  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test('a narrower customer policy refuses the same worker', async ({ page }) => {
  await page.goto('/demo/worker-src-eslint/narrow-policy');
  await expect(page.locator('#script')).toHaveText(config.workerScript);
  await expect(page.locator('#total')).toHaveText('Blocked (worker-src)');
  await expect(page.locator('#status')).toHaveText('Blocked (worker-src)');
  const blocked = `${new URL(page.url()).origin}${config.workerScript}`;
  await expect
    .poll(() => page.evaluate(() => window.cspViolations))
    .toEqual([
      { directive: 'worker-src', blocked },
      { directive: 'worker-src', blocked },
    ]);
  await page.screenshot({ path: 'test-results/narrow-policy.png' });
});
