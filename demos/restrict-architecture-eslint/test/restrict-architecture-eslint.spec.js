import { test, expect } from '@playwright/test';
import { recordViolations } from '../../common/test-helpers.js';
import { config } from '../config.js';

const origins = Object.values(config).join(' ');

test.beforeEach(({ page }) => recordViolations(page));

test('the policy from config.js allows every call the client makes', async ({
  page,
}) => {
  await page.goto('/demo/restrict-architecture-eslint/from-config');
  await expect(page.locator('#origins')).toHaveText(origins);
  await expect(page.locator('#profile')).toHaveText('Loaded: Elena');
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

test('a narrower customer policy blocks the same calls', async ({ page }) => {
  await page.goto('/demo/restrict-architecture-eslint/narrow-policy');
  await expect(page.locator('#origins')).toHaveText(origins);
  await expect(page.locator('#profile')).toHaveText('Blocked (TypeError)');
  await expect(page.locator('#status')).toHaveText('Blocked (TypeError)');
  await expect
    .poll(() => page.evaluate(() => window.cspViolations))
    .toEqual([
      { directive: 'connect-src', blocked: `${config.apiOrigin}/profile` },
      { directive: 'connect-src', blocked: `${config.apiOrigin}/status` },
    ]);
  await page.screenshot({ path: 'test-results/narrow-policy.png' });
});
