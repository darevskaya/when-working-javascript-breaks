import { test, expect } from '@playwright/test';
import { recordViolations } from '../../common/test-helpers.js';

test.beforeEach(({ page }) => recordViolations(page));

const productName = (page) => page.locator('.product-name');
const status = (page) => page.locator('#status');

const saleTag = (page) => page.locator('.product-name em');

test('string, no header: the product label becomes markup', async ({ page }) => {
  await page.goto('/demo/restrict-inner-html/no-header');
  await expect(status(page)).toHaveText('The preview rendered.');
  await expect(saleTag(page)).toHaveText('SALE');
  expect(await page.evaluate(() => window.cspViolations)).toEqual([]);
  await page.screenshot({ path: 'test-results/preview-no-header.png' });
});

test('string, header on: the browser refuses the write', async ({ page }) => {
  await page.goto('/demo/restrict-inner-html/string');
  await expect(status(page)).toContainText('The browser refused the write.');
  await expect(status(page)).toContainText('TypeError');
  await expect(page.locator('.preview-loading')).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => window.cspViolations))
    .toContainEqual(
      expect.objectContaining({ directive: 'require-trusted-types-for' }),
    );
  await page.screenshot({ path: 'test-results/preview-string.png' });
});

test('sanitizeHtml, header on: the preview renders, and scripts are removed', async ({
  page,
}) => {
  await page.goto('/demo/restrict-inner-html/policy');
  await expect(status(page)).toHaveText('The preview rendered.');
  await expect(saleTag(page)).toHaveText('SALE');
  expect(
    await page.evaluate(async () => {
      const { sanitizeHtml } = await import('/renderers/sanitize.js');
      const element = document.createElement('div');
      element.innerHTML = sanitizeHtml(
        '<img src="x" onerror="alert(1)"><script>alert(2)</script><em>ok</em>',
      );
      return element.innerHTML;
    }),
  ).toBe('<img src="x"><em>ok</em>');
  expect(await page.evaluate(() => window.cspViolations)).toEqual([]);
  await page.screenshot({ path: 'test-results/preview-policy.png' });

  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test('DOM nodes, header on: the preview renders with no policy', async ({
  page,
}) => {
  await page.goto('/demo/restrict-inner-html/dom');
  await expect(status(page)).toHaveText('The preview rendered.');
  await expect(productName(page)).toHaveText('Fern & Co. <em>SALE</em>');
  await expect(saleTag(page)).toHaveCount(0);
  expect(await page.evaluate(() => window.cspViolations)).toEqual([]);
  await page.screenshot({ path: 'test-results/preview-dom.png' });
});
