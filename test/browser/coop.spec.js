import { test, expect } from '@playwright/test';

async function openLogin(page, context, policy) {
  // A COOP-separated window may not retain Playwright's opener association.
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
  await page.goto('/demo/coop');
  await expect(page.locator('#status')).toHaveText('Ready');
  let popup = await openLogin(page, context, 'permissive');
  await expect(page.locator('#popup-closed')).toHaveText('false');
  await expect(popup.locator('#opener-state')).toHaveText('present');
  await popup.getByRole('button', { name: 'Continue as Elena' }).click();
  await expect(page.locator('#status')).toHaveText('Logged in as Elena');
  await expect.poll(() => popup.isClosed()).toBe(true);
  await expect(page.locator('#popup-closed')).toHaveText('true');

  await page
    .getByRole('radio', {
      name: 'Cross-Origin-Opener-Policy: same-origin',
      exact: true,
    })
    .check();
  popup = await openLogin(page, context, 'restricted');
  await expect(page.locator('#popup-closed')).toHaveText('true');
  expect(popup.isClosed()).toBe(false);
  await expect(popup.locator('#opener-state')).toHaveText('null');
  expect(await popup.evaluate(() => window.opener)).toBe(null);
  await popup.getByRole('button', { name: 'Continue as Elena' }).click();
  await expect(popup.locator('#status')).toHaveText(
    'Login could not finish. The connection to the app is missing, so the app is still waiting. Close this window to try again.',
  );
  await popup.screenshot({
    path: 'test-results/coop-provider-restricted.png',
    fullPage: true,
  });
  await expect(page.locator('#status')).toHaveText('Waiting for login…');
  await popup.close();

  await page
    .getByRole('radio', { name: 'No COOP header', exact: true })
    .check();
  popup = await openLogin(page, context, 'permissive');
  await popup.getByRole('button', { name: 'Continue as Elena' }).click();
  await expect(page.locator('#status')).toHaveText('Logged in as Elena');
});

test('policy history, narrow layouts, and messages from unrelated windows', async ({
  page,
  context,
}) => {
  await page.goto('/demo/coop');
  await page
    .getByRole('radio', {
      name: 'Cross-Origin-Opener-Policy: same-origin',
      exact: true,
    })
    .check();
  await page.reload();
  await expect(
    page.getByRole('radio', {
      name: 'Cross-Origin-Opener-Policy: same-origin',
      exact: true,
    }),
  ).toBeChecked();
  await page.goBack();
  await expect(
    page.getByRole('radio', { name: 'No COOP header', exact: true }),
  ).toBeChecked();
  const popup = await openLogin(page, context, 'permissive');
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
  await page.goto('/demo/coop');
  await page.evaluate(() => {
    const open = window.open;
    window.open = (...args) => {
      window.open = open;
      return null;
    };
  });
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.locator('#status')).toContainText('Popup blocked');
  const popup = await openLogin(page, context, 'permissive');
  await popup.getByRole('button', { name: 'Continue as Elena' }).click();
  await expect(page.locator('#status')).toHaveText('Logged in as Elena');
});
