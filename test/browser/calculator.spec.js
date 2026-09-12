import { test, expect } from '@playwright/test';

for (const example of ['webpack', 'function']) {
  for (const policy of ['permissive', 'restricted']) {
    for (const version of ['original', 'fixed']) {
      test(`${example}: ${policy}, ${version}, failure only on opening`, async ({
        page,
      }) => {
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

        const response = await page.goto(
          `/demo/calculator/${policy}?example=${example}&version=${version}`,
        );
        expect(
          response
            .headers()
            ['content-security-policy'].includes("'unsafe-eval'"),
        ).toBe(policy === 'permissive');
        await expect(page.locator('iframe')).toHaveCount(0);
        await expect(page.locator('#calculator-status')).toHaveText('Ready');
        await expect(page.getByRole('dialog')).not.toBeVisible();
        expect(bundles).toEqual([]);
        expect(await page.evaluate(() => window.cspViolations)).toEqual([]);
        await expect(
          page.getByRole('radio', {
            name:
              example === 'webpack' ? 'Webpack build' : 'Function constructor',
            exact: true,
          }),
        ).toBeChecked();
        await expect(
          page.getByRole('radio', {
            name:
              example === 'webpack'
                ? version === 'fixed'
                  ? 'source-map'
                  : 'eval-source-map'
                : version === 'fixed'
                  ? 'Regular function'
                  : 'new Function',
            exact: true,
          }),
        ).toBeChecked();

        await page.getByRole('button', { name: 'Open calculator' }).click();
        const bundle =
          example === 'webpack' && version === 'original' ? 'eval' : 'fixed';
        expect(bundles).toHaveLength(1);
        expect(bundles[0]).toContain(`/bundles/${bundle}/dialog.js`);

        if (policy === 'restricted' && version === 'original') {
          await expect(page.getByRole('dialog')).not.toBeVisible();
          await expect(page.locator('#calculator-status')).toContainText(
            'Calculator unavailable',
          );
          await expect
            .poll(() => page.evaluate(() => window.cspViolations))
            .toContainEqual({ directive: 'script-src', blocked: 'eval' });
          // A downloaded eval-free bundle initializes before new Function fails.
          expect(
            await page.evaluate(
              () => typeof window.CalculatorDialog?.openCalculatorDialog,
            ),
          ).toBe(example === 'function' ? 'function' : 'undefined');
        } else {
          await expect(page.getByRole('dialog')).toBeVisible();
          await page.getByRole('button', { name: 'Calculate total' }).click();
          await expect(page.locator('#total')).toHaveText('Total: $75.00');
          expect(await page.evaluate(() => window.cspViolations)).toEqual([]);
        }
      });
    }
  }
}

test('controls, refresh, and history keep each selection independent', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page).toHaveURL(
    '/demo/calculator/permissive?example=webpack&version=original',
  );
  await page
    .getByRole('radio', { name: "script-src 'self'", exact: true })
    .check();
  await expect(page).toHaveURL(
    '/demo/calculator/restricted?example=webpack&version=original',
  );
  await page
    .getByRole('radio', { name: 'Function constructor', exact: true })
    .check();
  await expect(page).toHaveURL(
    '/demo/calculator/restricted?example=function&version=original',
  );
  await page
    .getByRole('radio', { name: 'Regular function', exact: true })
    .check();
  await expect(page).toHaveURL(
    '/demo/calculator/restricted?example=function&version=fixed',
  );
  await page.reload();
  for (const name of [
    "script-src 'self'",
    'Function constructor',
    'Regular function',
  ]) {
    await expect(page.getByRole('radio', { name, exact: true })).toBeChecked();
  }
  await page.getByRole('button', { name: 'Open calculator' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Close', exact: true }).click();

  await page.goBack();
  await expect(page).toHaveURL(
    '/demo/calculator/restricted?example=function&version=original',
  );
  await expect(
    page.getByRole('radio', { name: 'new Function', exact: true }),
  ).toBeChecked();
  await page.getByRole('button', { name: 'Open calculator' }).click();
  await expect(page.locator('#calculator-status')).toContainText(
    'Calculator unavailable',
  );
  await page.goForward();
  await expect(
    page.getByRole('radio', { name: 'Regular function', exact: true }),
  ).toBeChecked();

  await page.getByRole('radio', { name: 'Webpack build', exact: true }).check();
  await expect(page).toHaveURL(
    '/demo/calculator/restricted?example=webpack&version=fixed',
  );
  await page
    .getByRole('radio', {
      name: "script-src 'self' 'unsafe-eval'",
      exact: true,
    })
    .check();
  await expect(page).toHaveURL(
    '/demo/calculator/permissive?example=webpack&version=fixed',
  );
});

test('calculation, input validation, Close, Escape, and responsive layout', async ({
  page,
}, testInfo) => {
  await page.goto('/demo/calculator/restricted?example=function&version=fixed');
  await page.screenshot({ path: testInfo.outputPath('calculator-page.png') });
  await page.getByRole('button', { name: 'Open calculator' }).click();
  await page.getByLabel('Unit price ($)', { exact: true }).fill('12.50');
  await page.getByLabel('Quantity', { exact: true }).fill('4');
  await page.getByRole('button', { name: 'Calculate total' }).click();
  await expect(page.locator('#total')).toHaveText('Total: $50.00');
  await page.screenshot({ path: testInfo.outputPath('calculator-dialog.png') });

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
    await expect(page.locator('#calculator-status')).toHaveText('Ready');
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
  await page.screenshot({ path: testInfo.outputPath('calculator-mobile.png') });
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await page.screenshot({ path: testInfo.outputPath('controls-mobile.png') });
});

test('a failed bundle download can be retried', async ({ page }) => {
  await page.goto('/demo/calculator/restricted?version=fixed');
  await page.route('**/bundles/fixed/dialog.js', (route) => route.abort(), {
    times: 1,
  });
  await page.getByRole('button', { name: 'Open calculator' }).click();
  await expect(page.locator('#calculator-status')).toContainText(
    'Calculator unavailable',
  );
  await page.getByRole('button', { name: 'Open calculator' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
});
