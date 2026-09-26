import { test, expect } from '@playwright/test';

async function openLogin(page, context, version) {
  // COOP can sever Playwright's opener association.
  const opened = context.waitForEvent('page');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  const popup = await opened;
  await popup.waitForURL(`**/provider/login/${version}`);
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
  let popup = await openLogin(page, context, 'v1');
  await popup.getByRole('button', { name: 'Continue as Elena' }).click();
  await expect(page.locator('#status')).toHaveText('Logged in as Elena');
  await expect.poll(() => popup.isClosed()).toBe(true);
  await expect(
    page.getByRole('button', { name: 'Sign in', exact: true }),
  ).toBeHidden();

  await page.goto('/demo/coop-popup/coop-on-login');
  popup = await openLogin(page, context, 'v2');
  expect(popup.isClosed()).toBe(false);
  expect(await popup.evaluate(() => window.opener)).toBe(null);
  await popup.screenshot({
    path: 'test-results/coop-provider-restricted.png',
    fullPage: true,
  });
  await popup.getByRole('button', { name: 'Continue as Elena' }).click();
  // Back on the app origin, the popup still has no opener.
  await popup.waitForURL('**/login/callback?user=Elena');
  expect(await popup.evaluate(() => window.opener)).toBe(null);
  expect(popup.isClosed()).toBe(false);
  await expect(page.locator('#status')).toHaveText('Waiting for login…');
  await popup.close();

  await page.goto('/demo/coop-popup/no-coop');
  popup = await openLogin(page, context, 'v1');
  await popup.getByRole('button', { name: 'Continue as Elena' }).click();
  await expect(page.locator('#status')).toHaveText('Logged in as Elena');
});

test('narrow layouts and messages from unrelated windows', async ({
  page,
  context,
}) => {
  await page.goto('/demo/coop-popup/no-coop');
  const popup = await openLogin(page, context, 'v1');
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
  const popup = await openLogin(page, context, 'v1');
  await popup.getByRole('button', { name: 'Continue as Elena' }).click();
  await expect(page.locator('#status')).toHaveText('Logged in as Elena');
});
