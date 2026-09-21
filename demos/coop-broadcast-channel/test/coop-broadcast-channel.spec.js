import { test, expect } from '@playwright/test';

async function openLogin(page, context, loginPath) {
  // noopener requires listening on the context.
  const opened = context.waitForEvent('page');
  const start = context.waitForEvent('request', (request) =>
    request.url().includes('/bff/login'),
  );
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  expect((await start).headers().referer).toBeUndefined();
  const popup = await opened;
  await popup.waitForURL(`**${loginPath}?return_to=**code_challenge=**`);
  return popup;
}

const modes = [
  { mode: 'no-coop', loginPath: '/login/no-coop' },
  { mode: 'coop-on-app', loginPath: '/login/no-coop' },
  { mode: 'coop-on-login', loginPath: '/login/coop' },
];

for (const { mode, loginPath } of modes) {
  test(`${mode}: the BFF signs in, and the channel says only done`, async ({
    page,
    context,
  }) => {
    const messages = [];
    await page.exposeFunction('recordMessage', (data) => messages.push(data));
    await page.addInitScript(() =>
      new BroadcastChannel('orbit-login').addEventListener('message', (event) =>
        window.recordMessage(event.data),
      ),
    );
    await page.goto(`/demo/coop-broadcast-channel/${mode}`);
    const popup = await openLogin(page, context, loginPath);
    await expect(page.locator('#open-result')).toHaveText('null');
    await expect(page.locator('#status')).toContainText('Waiting for login…');
    await popup.getByRole('button', { name: 'Continue as Elena' }).click();
    await expect(page.locator('#status')).toHaveText('Logged in as Elena');
    await expect.poll(() => popup.isClosed()).toBe(true);
    await expect(
      page.getByRole('button', { name: 'Sign in', exact: true }),
    ).toBeHidden();

    expect(messages).toEqual([{ type: 'login-complete' }]);
    // HttpOnly hides the session from scripts.
    expect(await page.evaluate(() => document.cookie)).toBe('');
    const session = (await context.cookies()).find(
      (cookie) => cookie.name === 'bff_session',
    );
    expect(session).toMatchObject({ httpOnly: true, sameSite: 'Strict' });
  });
}

test('a "done" message without a session does not sign in', async ({
  page,
  context,
}) => {
  await page.goto('/demo/coop-broadcast-channel/no-coop');
  const popup = await openLogin(page, context, '/login/no-coop');
  const other = await context.newPage();
  await other.goto('/demo/coop-broadcast-channel/no-coop');
  await other.evaluate(() =>
    new BroadcastChannel('orbit-login').postMessage({ type: 'login-complete' }),
  );
  await page.waitForTimeout(500);
  await expect(page.locator('#status')).toContainText('Waiting for login…');
  await popup.getByRole('button', { name: 'Continue as Elena' }).click();
  await expect(page.locator('#status')).toHaveText('Logged in as Elena');
});

test('the BFF answers only with its CSRF header', async ({ page, request }) => {
  await page.goto('/demo/coop-broadcast-channel/no-coop');
  expect((await request.get('/bff/user')).status()).toBe(403);
  expect(
    (await request.get('/bff/user', { headers: { 'X-CSRF': '1' } })).status(),
  ).toBe(401);
});
