import { test, expect } from '@playwright/test';
import { recordViolations } from '../../common/test-helpers.js';

test.beforeEach(({ page }) => recordViolations(page));

const heading = (page) => page.locator('.orbit-widget h2');
const status = (page) => page.locator('#status');

// The shop name in app.html holds a tag. A style that writes the name as
// markup turns it into an element. A style that escapes it shows the text.
const shopTag = (page) => page.locator('.orbit-widget h2 em');

test('string, no header: the shop name becomes a tag', async ({ page }) => {
  await page.goto('/demo/trusted-types/no-header');
  await expect(status(page)).toHaveText('The widget rendered.');
  await expect(shopTag(page)).toHaveText('SALE');
  expect(await page.evaluate(() => window.cspViolations)).toEqual([]);
  await page.screenshot({ path: 'test-results/widget-no-header.png' });
});

test('string, header on: the browser refuses the write', async ({ page }) => {
  await page.goto('/demo/trusted-types/string');
  await expect(status(page)).toContainText('The browser refused the write.');
  await expect(status(page)).toContainText('TypeError');
  // The widget never rendered, so the loading text stays.
  await expect(page.locator('.orbit-loading')).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => window.cspViolations))
    .toContainEqual(
      expect.objectContaining({ directive: 'require-trusted-types-for' }),
    );
  await page.screenshot({ path: 'test-results/widget-string.png' });
});

test('escapeHtml, header on: the browser refuses it too', async ({ page }) => {
  await page.goto('/demo/trusted-types/escape');
  await expect(status(page)).toContainText('The browser refused the write.');
  await expect(status(page)).toContainText('TypeError');
  await expect(page.locator('.orbit-loading')).toBeVisible();
  await page.screenshot({ path: 'test-results/widget-escape.png' });
});

test('policyHtml, header on: the widget renders, and the name is text', async ({
  page,
}) => {
  await page.goto('/demo/trusted-types/policy');
  await expect(status(page)).toHaveText('The widget rendered.');
  await expect(heading(page)).toHaveText('Sign in to Fern & Co. <em>SALE</em>');
  await expect(shopTag(page)).toHaveCount(0);
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
  await page.goto('/demo/trusted-types/dom');
  await expect(status(page)).toHaveText('The widget rendered.');
  await expect(heading(page)).toHaveText('Sign in to Fern & Co. <em>SALE</em>');
  await expect(shopTag(page)).toHaveCount(0);
  expect(await page.evaluate(() => window.cspViolations)).toEqual([]);
  await page.screenshot({ path: 'test-results/widget-dom.png' });
});
