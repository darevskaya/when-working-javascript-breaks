import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.cspViolations = [];
    document.addEventListener('securitypolicyviolation', (event) => {
      window.cspViolations.push({
        directive: event.effectiveDirective,
        blocked: event.blockedURI,
      });
    });
  });
});

// True when every pixel of the canvas is still transparent black.
const canvasIsEmpty = (page) =>
  page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    return canvas
      .getContext('2d')
      .getImageData(0, 0, canvas.width, canvas.height)
      .data.every((value) => value === 0);
  });

test('Blob worker renders under worker-src self blob:', async ({ page }) => {
  await page.goto('/demo/worker-src-blob/blob-allowed');
  await expect(page.locator('#status')).toHaveText('Render complete');
  await expect(page.getByRole('progressbar')).toHaveJSProperty('value', 100);
  expect(
    await page.evaluate(() => {
      const context = document.querySelector('canvas').getContext('2d');
      const center = Array.from(context.getImageData(480, 300, 1, 1).data);
      const corner = Array.from(context.getImageData(0, 0, 1, 1).data);
      return (
        center[3] === 255 &&
        corner[3] === 255 &&
        center.join() !== corner.join()
      );
    }),
  ).toBe(true);
  expect(await page.evaluate(() => window.cspViolations)).toEqual([]);
  await page.screenshot({ path: 'test-results/fractal-permissive.png' });

  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: 'test-results/fractal-mobile.png' });
});

test('Blob worker is blocked under worker-src self', async ({ page }) => {
  await page.goto('/demo/worker-src-blob/blob-blocked');
  await expect(page.locator('#status')).toHaveText(
    'Worker blocked by Content Security Policy',
  );
  await expect(page.locator('#status')).toHaveClass('blocked');
  await expect(page.locator('#status')).toBeInViewport();
  await expect(page.getByRole('progressbar')).toHaveJSProperty('value', 0);
  await expect
    .poll(() => page.evaluate(() => window.cspViolations))
    .toContainEqual({ directive: 'worker-src', blocked: 'blob' });
  expect(await canvasIsEmpty(page)).toBe(true);
  await page.screenshot({ path: 'test-results/fractal-restricted.png' });
});

test('module worker renders under worker-src self', async ({ page }) => {
  await page.goto('/demo/worker-src-blob/module-worker');
  await expect(page.locator('#status')).toHaveText('Render complete');
  expect(await canvasIsEmpty(page)).toBe(false);
  expect(await page.evaluate(() => window.cspViolations)).toEqual([]);
});
