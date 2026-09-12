import { test, expect } from '@playwright/test';

test('the demo loads without font requests or font policy violations', async ({
  page,
}) => {
  const fontRequests = [];
  const fontErrors = [];
  page.on('request', (request) => {
    if (request.resourceType() === 'font') fontRequests.push(request.url());
  });
  page.on('console', (message) => {
    if (message.type() === 'error' && /font/i.test(message.text())) {
      fontErrors.push(message.text());
    }
  });

  await page.goto('/');
  for (const policy of ['Permissive', 'Restricted']) {
    for (const build of ['eval-source-map', 'source-map']) {
      await page.getByRole('radio', { name: policy, exact: true }).check();
      await page.getByRole('radio', { name: build, exact: true }).check();
      const account = page.frameLocator('#account-frame');
      const policyValue = policy === 'Permissive' ? 'baseline' : 'restricted';
      const buildValue = build === 'eval-source-map' ? 'eval' : 'fixed';
      await expect
        .poll(() => account.locator('body').evaluate(() => location.search))
        .toBe(`?policy=${policyValue}&build=${buildValue}`);
      await expect(account.locator('#account-status')).toHaveText(
        'Account ready',
      );
      const fontFaces = await account.locator('body').evaluate(async () => {
        await document.fonts.ready;
        return document.fonts.size;
      });
      expect(fontFaces).toBe(0);
    }
  }
  expect(fontRequests).toEqual([]);
  expect(fontErrors).toEqual([]);
});

test('one account switches headers and builds independently', async ({
  page,
}, testInfo) => {
  const bundles = [];
  const errors = [];
  page.on('request', (request) => {
    if (request.url().includes('/bundles/')) bundles.push(request.url());
  });
  page.on('pageerror', (error) => errors.push(error));

  await page.goto('/');
  await expect(page.locator('iframe')).toHaveCount(1);
  const account = page.frameLocator('#account-frame');
  const open = account.getByRole('button', { name: 'Change display name' });
  await expect(account.locator('#account-status')).toHaveText('Account ready');
  expect(bundles).toHaveLength(0);

  // Each change must fetch a new document with the requested policy and build.
  async function select(name, policy, build) {
    errors.length = 0;
    const responsePromise = page.waitForResponse((response) =>
      response.url().endsWith(`/demo/eval?policy=${policy}&build=${build}`),
    );
    await page.getByRole('radio', { name, exact: true }).check();
    const response = await responsePromise;
    const header = response.headers()['content-security-policy'];
    expect(header.includes("'unsafe-eval'")).toBe(policy === 'baseline');
    await expect
      .poll(() => account.locator('body').evaluate(() => location.search))
      .toBe(`?policy=${policy}&build=${build}`);
    await expect(account.locator('#account-status')).toHaveText(
      'Account ready',
    );
  }

  await open.click();
  await expect(account.getByRole('dialog')).toBeVisible();
  await account.getByLabel('Display name', { exact: true }).fill('Ada');
  await account.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(account.locator('#current-name')).toHaveText('Ada');

  await select('Restricted', 'restricted', 'eval');
  await expect(account.locator('#current-name')).toHaveText('Elena');
  await open.click();
  await expect(account.locator('#account-status')).toContainText(
    'Dialog unavailable',
  );
  await expect(account.getByRole('dialog')).not.toBeVisible();
  await expect
    .poll(() =>
      errors.some(
        (error) =>
          error.name === 'EvalError' &&
          error.message.includes('Content Security Policy'),
      ),
    )
    .toBe(true);
  expect(bundles).toHaveLength(2);
  expect(bundles[0]).toBe(bundles[1]);

  await select('source-map', 'restricted', 'fixed');
  await expect(
    page.getByRole('radio', { name: 'Restricted', exact: true }),
  ).toBeChecked();
  await open.click();
  await expect(account.getByRole('dialog')).toBeVisible();

  await select('Permissive', 'baseline', 'fixed');
  await expect(
    page.getByRole('radio', { name: 'source-map', exact: true }),
  ).toBeChecked();
  await open.click();
  await expect(account.getByRole('dialog')).toBeVisible();

  await select('Restricted', 'restricted', 'fixed');
  await select('eval-source-map', 'restricted', 'eval');
  await open.click();
  await expect(account.locator('#account-status')).toContainText(
    'Dialog unavailable',
  );
  await expect
    .poll(() =>
      errors.some(
        (error) =>
          error.name === 'EvalError' &&
          error.message.includes('Content Security Policy'),
      ),
    )
    .toBe(true);

  await select('Permissive', 'baseline', 'eval');
  await open.click();
  await expect(account.getByRole('dialog')).toBeVisible();
  await account.getByRole('button', { name: 'Cancel' }).click();
  await page.screenshot({ path: testInfo.outputPath('account-desktop.png') });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
  await open.click();
  await expect(account.getByRole('dialog')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('account-mobile.png') });
});

test('cancel, Escape, validation, and reopening preserve the saved name', async ({
  page,
}) => {
  await page.goto('/demo/eval?policy=restricted&build=fixed');
  const open = page.getByRole('button', { name: 'Change display name' });
  const input = page.getByLabel('Display name', { exact: true });

  for (const close of ['Cancel', 'Escape']) {
    await open.click();
    await input.fill('Unsaved');
    if (close === 'Cancel')
      await page.getByRole('button', { name: 'Cancel' }).click();
    else await input.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.locator('#current-name')).toHaveText('Elena');
    await expect(page.locator('#account-status')).toHaveText('Account ready');
  }

  await open.click();
  await expect(input).toHaveValue('Elena');
  await input.fill('   ');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(input).toHaveJSProperty(
    'validationMessage',
    'Enter a name, not just spaces.',
  );
  await input.fill('  Ada  ');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.locator('#current-name')).toHaveText('Ada');
  await expect(page.locator('.avatar')).toHaveText('A');
  await expect(page.locator('#account-status')).toHaveText(
    'Display name saved',
  );
});

test('a failed feature download can be retried', async ({ page }) => {
  await page.goto('/demo/eval?policy=restricted&build=fixed');
  await page.route('**/bundles/fixed/dialog.js', (route) => route.abort(), {
    times: 1,
  });
  const open = page.getByRole('button', { name: 'Change display name' });
  await open.click();
  await expect(page.locator('#account-status')).toContainText(
    'Dialog unavailable',
  );
  await open.click();
  await expect(page.getByRole('dialog')).toBeVisible();
});
