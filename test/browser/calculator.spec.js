import { test, expect } from '@playwright/test';

for (const policy of ['permissive', 'restricted']) {
  test(`${policy}: failure only on opening`, async ({ page }) => {
    const bundles = [];
    page.on('request', (request) => {
      if (request.url().includes('/bundles/')) bundles.push(request.url());
    });
    await page.addInitScript(() => {
      window.cspViolations = [];
      document.addEventListener('securitypolicyviolation', (event) => {
        window.cspViolations.push({
          directive: event.effectiveDirective,
          blocked: event.blockedURI,
        });
      });
    });
    const response = await page.goto(`/demo/calculator/${policy}`);
    expect(
      response.headers()['content-security-policy'].includes("'unsafe-eval'"),
    ).toBe(policy === 'permissive');
    await expect(page.locator('iframe')).toHaveCount(0);
    await expect(page.locator('#status')).toHaveText('Ready');
    await expect(page.getByRole('dialog')).not.toBeVisible();
    expect(bundles).toEqual([]);
    expect(await page.evaluate(() => window.cspViolations)).toEqual([]);
    await page.getByRole('button', { name: 'Open calculator' }).click();
    if (policy === 'restricted') {
      await expect(page.locator('#status')).toHaveClass('blocked');
      await expect(page.locator('#status')).toContainText('unsafe-eval');
      await expect(page.getByRole('dialog')).not.toBeVisible();
      await expect
        .poll(() => page.evaluate(() => window.cspViolations))
        .toContainEqual({ directive: 'script-src', blocked: 'eval' });
      expect(
        await page.evaluate(
          () => typeof window.CalculatorDialog?.openCalculatorDialog,
        ),
      ).toBe('function');
    } else {
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.getByRole('button', { name: 'Calculate total' }).click();
      await expect(page.locator('#total')).toHaveText('Total: $75.00');
      for (const [operation, expected] of [
        ['discount', 'Total: $67.50'],
        ['tax', 'Total: $90.00'],
        ['subtotal', 'Total: $75.00'],
      ]) {
        await page
          .getByLabel('Calculation', { exact: true })
          .selectOption(operation);
        await expect(page.locator('#total')).toHaveText('Total: —');
        await page.getByRole('button', { name: 'Calculate total' }).click();
        await expect(page.locator('#total')).toHaveText(expected);
      }
      expect(await page.evaluate(() => window.cspViolations)).toEqual([]);
    }
    expect(bundles).toHaveLength(1);
    expect(bundles[0]).toContain('/bundles/dialog.js');
  });
}

test('eval-build: a clean source still fails, because the bundle uses eval', async ({
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
  const bundle = page.waitForResponse('**/bundles/eval/dialog.js');
  await page.goto('/demo/calculator/eval-build');
  await page.getByRole('button', { name: 'Open calculator' }).click();
  expect((await bundle).status()).toBe(200);
  await expect(page.locator('#status')).toHaveClass('blocked');
  await expect(page.locator('#status')).toHaveText(
    'The dialog bundle downloaded but did not run.',
  );
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect
    .poll(() => page.evaluate(() => window.cspViolations))
    .toContainEqual({ directive: 'script-src', blocked: 'eval' });
});

test('calculation, input validation, Close, Escape, and responsive layout', async ({
  page,
}) => {
  await page.goto('/demo/calculator/permissive');
  await page.getByRole('button', { name: 'Open calculator' }).click();
  await page.getByLabel('Unit price ($)', { exact: true }).fill('12.50');
  await page.getByLabel('Quantity', { exact: true }).fill('4');
  await page.getByRole('button', { name: 'Calculate total' }).click();
  await expect(page.locator('#total')).toHaveText('Total: $50.00');

  await page.getByLabel('Quantity', { exact: true }).fill('1.5');
  await page.getByRole('button', { name: 'Calculate total' }).click();
  await expect(page.locator('#total')).toHaveText('Total: —');
  await expect(page.getByLabel('Quantity', { exact: true })).toHaveJSProperty(
    'validity.stepMismatch',
    true,
  );
  await page.getByLabel('Quantity', { exact: true }).fill('3');

  for (const close of ['Close', 'Escape']) {
    if (close === 'Close')
      await page.getByRole('button', { name: 'Close', exact: true }).click();
    else await page.getByLabel('Quantity', { exact: true }).press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.locator('#status')).toHaveText('Ready');
    await expect(
      page.getByRole('button', { name: 'Open calculator' }),
    ).toBeFocused();
    await page.getByRole('button', { name: 'Open calculator' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole('button', { name: 'Calculate total' }).click();
  await expect(page.locator('#total')).toHaveText('Total: $37.50');
  await page.getByRole('button', { name: 'Close', exact: true }).click();
});

test('a failed bundle download can be retried', async ({ page }) => {
  await page.goto('/demo/calculator/permissive');
  await page.route('**/bundles/dialog.js', (route) => route.abort(), {
    times: 1,
  });
  await page.getByRole('button', { name: 'Open calculator' }).click();
  await expect(page.locator('#status')).toContainText('failed to load');
  await page.getByRole('button', { name: 'Open calculator' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
});
