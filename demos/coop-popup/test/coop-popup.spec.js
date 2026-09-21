import { test, expect } from '@playwright/test';

async function openLogin(page, context, policy) {
  // COOP can sever Playwright's opener association.
  const opened = context.waitForEvent('page');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  const popup = await opened;
  await popup.waitForURL(`**/login/${policy}`);
  await expect(
    popup.getByRole('button', { name: 'Continue as Elena' }),
  ).toBeEnabled();
  return popup;
}

test('provider COOP severs references; a fresh permissive login recovers', async ({
  page,
  context,
}) => {
  await page.goto('/demo/coop-popup/no-coop');
  await expect(page.locator('#status')).toHaveText('Ready');
  let popup = await openLogin(page, context, 'no-coop');
  await expect(page.locator('#popup-closed')).toHaveText('false');
  await expect(popup.locator('#opener-state')).toHaveText('present');
  await popup.getByRole('button', { name: 'Continue as Elena' }).click();
  await expect(page.locator('#status')).toHaveText('Logged in as Elena');
  await expect.poll(() => popup.isClosed()).toBe(true);
  await expect(
    page.getByRole('button', { name: 'Sign in', exact: true }),
  ).toBeHidden();
  await expect(page.locator('#popup-closed')).toHaveText('true');

  await page.goto('/demo/coop-popup/coop-on-login');
  popup = await openLogin(page, context, 'coop');
  await expect(page.locator('#popup-closed')).toHaveText('true');
  expect(popup.isClosed()).toBe(false);
  await expect(popup.locator('#opener-state')).toHaveText('null');
  expect(await popup.evaluate(() => window.opener)).toBe(null);
  await popup.screenshot({
    path: 'test-results/coop-provider-restricted.png',
    fullPage: true,
  });
  await popup.getByRole('button', { name: 'Continue as Elena' }).click();
  await expect.poll(() => popup.isClosed()).toBe(true);
  await expect(page.locator('#status')).toHaveText(
    'Login canceled by the user.',
  );

  await page.goto('/demo/coop-popup/no-coop');
  popup = await openLogin(page, context, 'no-coop');
  await popup.getByRole('button', { name: 'Continue as Elena' }).click();
  await expect(page.locator('#status')).toHaveText('Logged in as Elena');
});

test('host COOP cuts the popup, and the app blames the user', async ({
  page,
  context,
}) => {
  const document = page.waitForResponse('**/demo/coop-popup/coop-on-app');
  await page.goto('/demo/coop-popup/coop-on-app');
  expect((await document).headers()['cross-origin-opener-policy']).toBe(
    'same-origin',
  );
  const popup = await openLogin(page, context, 'no-coop');
  await expect(popup.locator('#opener-state')).toHaveText('null');
  await expect(page.locator('#popup-closed')).toHaveText('true');
  await expect(page.locator('#status')).toHaveText(
    'Login canceled by the user.',
  );
  expect(popup.isClosed()).toBe(false);
  await page.screenshot({ path: 'test-results/coop-host.png' });
  await popup.getByRole('button', { name: 'Continue as Elena' }).click();
  await expect.poll(() => popup.isClosed()).toBe(true);
  await expect(page.locator('#status')).toHaveText(
    'Login canceled by the user.',
  );
});

test('closing the popup without a login reports a cancel', async ({
  page,
  context,
}) => {
  await page.goto('/demo/coop-popup/no-coop');
  const popup = await openLogin(page, context, 'no-coop');
  await expect(page.locator('#popup-closed')).toHaveText('false');
  await popup.close();
  await expect(page.locator('#popup-closed')).toHaveText('true');
  await expect(page.locator('#status')).toHaveText(
    'Login canceled by the user.',
  );
});

test('narrow layouts and messages from unrelated windows', async ({
  page,
  context,
}) => {
  await page.goto('/demo/coop-popup/no-coop');
  const popup = await openLogin(page, context, 'no-coop');
  await page.evaluate(() =>
    window.postMessage(
      { type: 'login-complete', user: 'Mallory' },
      location.origin,
    ),
  );
  await popup.evaluate(() =>
    window.opener.postMessage({ type: 'login-complete', user: 42 }, '*'),
  );
  await expect(page.locator('#status')).toHaveText('Waiting for login…');
  for (const target of [page, popup]) {
    await target.setViewportSize({ width: 390, height: 844 });
    expect(
      await target.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.screenshot({ path: 'test-results/coop-app.png' });
  await popup.screenshot({ path: 'test-results/coop-provider.png' });
  await popup.close();
});

test('a blocked popup can be retried', async ({ page, context }) => {
  await page.goto('/demo/coop-popup/no-coop');
  await page.evaluate(() => {
    const open = window.open;
    window.open = (...args) => {
      window.open = open;
      return null;
    };
  });
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.locator('#status')).toContainText('Popup blocked');
  const popup = await openLogin(page, context, 'no-coop');
  await popup.getByRole('button', { name: 'Continue as Elena' }).click();
  await expect(page.locator('#status')).toHaveText('Logged in as Elena');
});
