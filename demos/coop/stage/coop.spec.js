import { test, expect } from '@playwright/test';

async function signIn(page, context) {
  await page.goto('/demo/coop/permissive');
  // Listen on the context because COOP can detach the popup from its opener.
  const opened = context.waitForEvent('page');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  const popup = await opened;
  await popup.getByRole('button', { name: 'Continue as Elena' }).click();
  return popup;
}

test('login completes with no policy', async ({ page, context }) => {
  await signIn(page, context);
  await expect(page.getByText('Logged in as Elena')).toBeVisible();
});

test('login completes under COOP', async ({ page, context }) => {
  // context.route catches the popup's first request; page.route does not.
  // Add the header to the provider document, where the login result is sent.
  await context.route('**/login/permissive', async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      headers: {
        ...response.headers(),
        'Cross-Origin-Opener-Policy': 'same-origin',
      },
    });
  });

  const popup = await signIn(page, context);
  console.log('window.opener:', await popup.evaluate(() => window.opener));
  console.log(await popup.locator('#status').textContent());
  await expect(page.getByText('Logged in as Elena')).toBeVisible();
});
