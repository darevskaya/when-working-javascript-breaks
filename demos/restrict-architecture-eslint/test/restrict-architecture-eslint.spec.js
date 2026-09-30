import { test, expect } from '@playwright/test';

test('the app calls the worker factory and receives both answers', async ({
  page,
}) => {
  await page.goto('/demo/restrict-architecture-eslint');
  await expect(page.locator('#total')).toHaveText('Total: 42.50');
  await expect(page.locator('#status')).toHaveText('ok');
  await page.screenshot({ path: 'test-results/worker-factory.png' });

  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBe(true);
});
