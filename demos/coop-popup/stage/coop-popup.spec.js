import { test, expect } from '@playwright/test';

async function signIn(page, context) {
  await page.goto('/demo/coop-popup/no-coop');
  const opened = context.waitForEvent('page');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  const popup = await opened;
  const opener = await popup.evaluate(() => window.opener);
  await popup.getByRole('button', { name: 'Continue as Elena' }).click();
  return { popup, opener };
}

test('login completes with no policy', async ({ page, context }) => {
  await signIn(page, context);
  await expect(page.getByText('Logged in as Elena')).toBeVisible();
});

test('login completes under COOP', async ({ page, context }) => {
  await context.route('**/provider/login/no-coop', async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      headers: {
        ...response.headers(),
        'Cross-Origin-Opener-Policy': 'same-origin',
      },
    });
  });

  const { opener } = await signIn(page, context);
  console.log('window.opener:', opener);
  await expect(page.getByText('Logged in as Elena')).toBeVisible();
});
