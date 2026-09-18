import { test, expect } from '@playwright/test';

test('Blob worker renders automatically, is blocked by CSP, and recovers on policy switch', async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.cspViolations = [];
    document.addEventListener('securitypolicyviolation', (event) => {
      window.cspViolations.push({
        directive: event.effectiveDirective,
        blocked: event.blockedURI,
      });
    });
  });
  await page.goto('/demo/fractal/permissive');
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

  await page
    .getByRole('radio', { name: "worker-src 'self'", exact: true })
    .check();
  await expect(page).toHaveURL('/demo/fractal/restricted');
  await expect(page.locator('#status')).toHaveText(
    'Worker blocked by Content Security Policy',
  );
  await expect(page.locator('#status')).toBeInViewport();
  await expect(page.getByRole('progressbar')).toHaveJSProperty('value', 0);
  await expect
    .poll(() => page.evaluate(() => window.cspViolations))
    .toContainEqual({ directive: 'worker-src', blocked: 'blob' });
  expect(
    await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      return canvas
        .getContext('2d')
        .getImageData(0, 0, canvas.width, canvas.height)
        .data.every((value) => value === 0);
    }),
  ).toBe(true);
  await page.screenshot({ path: 'test-results/fractal-restricted.png' });
  await page.reload();
  await expect(
    page.getByRole('radio', { name: "worker-src 'self'", exact: true }),
  ).toBeChecked();
  await expect(page.locator('#status')).toHaveClass('blocked');
  await page
    .getByRole('radio', { name: "worker-src 'self' blob:", exact: true })
    .check();
  await expect(page.locator('#status')).toHaveText('Render complete');
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: 'test-results/fractal-mobile.png' });
});

test('module worker renders under worker-src self with no violations', async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.cspViolations = [];
    document.addEventListener('securitypolicyviolation', (event) => {
      window.cspViolations.push(event.effectiveDirective);
    });
  });
  await page.goto('/demo/fractal/restricted');
  await expect(page.locator('#status')).toHaveText(
    'Worker blocked by Content Security Policy',
  );

  await page.getByRole('radio', { name: 'Module file', exact: true }).check();
  await expect(page).toHaveURL('/demo/fractal/restricted?script=module');
  await expect(
    page.getByRole('radio', { name: "worker-src 'self'", exact: true }),
  ).toBeChecked();
  await expect(page.locator('#status')).toHaveText('Render complete');
  expect(await page.evaluate(() => window.cspViolations)).toEqual([]);
});
