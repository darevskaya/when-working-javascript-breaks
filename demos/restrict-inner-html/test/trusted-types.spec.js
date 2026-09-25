import { test, expect } from '@playwright/test';
import { recordViolations } from '../../common/test-helpers.js';

test.beforeEach(({ page }) => recordViolations(page));

const heading = (page) => page.locator('.orbit-widget h2');
const status = (page) => page.locator('#status');

// The shop name deliberately contains markup.
const shopTag = (page) => page.locator('.orbit-widget h2 em');

test('string, no header: the shop name becomes a tag', async ({ page }) => {
  await page.goto('/demo/restrict-inner-html/no-header');
  await expect(status(page)).toHaveText('The widget rendered.');
  await expect(shopTag(page)).toHaveText('SALE');
  expect(await page.evaluate(() => window.cspViolations)).toEqual([]);
  await page.screenshot({ path: 'test-results/widget-no-header.png' });
});

test('string, header on: the browser refuses the write', async ({ page }) => {
  await page.goto('/demo/restrict-inner-html/string');
  await expect(status(page)).toContainText('The browser refused the write.');
  await expect(status(page)).toContainText('TypeError');
  await expect(page.locator('.orbit-loading')).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => window.cspViolations))
    .toContainEqual(
      expect.objectContaining({ directive: 'require-trusted-types-for' }),
    );
  await page.screenshot({ path: 'test-results/widget-string.png' });
});

test('sanitizeHtml, header on: the widget renders, and scripts are removed', async ({
  page,
}) => {
  await page.goto('/demo/restrict-inner-html/policy');
  await expect(status(page)).toHaveText('The widget rendered.');
  await expect(shopTag(page)).toHaveText('SALE');
  expect(
    await page.evaluate(async () => {
      const { sanitizeHtml } = await import('/render-with-policy.js');
      const element = document.createElement('div');
      element.innerHTML = sanitizeHtml(
        '<img src="x" onerror="alert(1)"><script>alert(2)</script><em>ok</em>',
      );
      return element.innerHTML;
    }),
  ).toBe('<img src="x"><em>ok</em>');
  expect(await page.evaluate(() => window.cspViolations)).toEqual([]);
  await page.screenshot({ path: 'test-results/widget-policy.png' });

  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test('DOM nodes, header on: the widget renders with no policy', async ({
  page,
}) => {
  await page.goto('/demo/restrict-inner-html/dom');
  await expect(status(page)).toHaveText('The widget rendered.');
  await expect(heading(page)).toHaveText('Sign in to Fern & Co. <em>SALE</em>');
  await expect(shopTag(page)).toHaveCount(0);
  expect(await page.evaluate(() => window.cspViolations)).toEqual([]);
  await page.screenshot({ path: 'test-results/widget-dom.png' });
});
