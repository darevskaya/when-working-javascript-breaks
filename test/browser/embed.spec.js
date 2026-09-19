import { test, expect } from '@playwright/test';

const frame = (page) => page.frameLocator('#orbit-slot iframe');

for (const mode of ['no-sandbox', 'user-activation']) {
  test(`${mode}: a click in the frame redirects to the login and back`, async ({
    page,
  }) => {
    await page.goto(`/demo/embed/${mode}`);
    await frame(page)
      .getByRole('button', { name: 'Continue with Orbit ID' })
      .click();
    await page.waitForURL('**/login/embed?**');
    await page.getByRole('button', { name: 'Continue as Elena' }).click();
    await expect(
      frame(page).getByRole('heading', { name: 'Signed in as Elena' }),
    ).toBeVisible();
    await expect(page.locator('#status')).toHaveText(
      'Orbit ID returned the user Elena.',
    );
    // The loader removes the user from the address after it reads it.
    await expect(page).toHaveURL(new RegExp(`/demo/embed/${mode}$`));
  });
}

test('no-top-navigation: the frame renders, but the login is blocked', async ({
  page,
}) => {
  const blocked = page.waitForEvent('console', (message) =>
    /Unsafe attempt to initiate navigation/.test(message.text()),
  );
  await page.goto('/demo/embed/no-top-navigation');
  await expect(page.locator('#embed-code')).toContainText(
    'sandbox="allow-scripts allow-same-origin"',
  );
  // The frame renders and its scripts run. The failure waits for the click.
  await frame(page)
    .getByRole('button', { name: 'Continue with Orbit ID' })
    .click();
  await blocked;
  await expect(frame(page).locator('#status')).toHaveText('Opening Orbit ID…');
  await expect(page).toHaveURL(/\/demo\/embed\/no-top-navigation$/);
  await expect(page.locator('#status')).toHaveText(
    'No user yet. The shop sees no error.',
  );
  await page.screenshot({ path: 'test-results/embed-no-top-navigation.png' });
});

test('the login returns only to the shop origin', async ({ page }) => {
  await page.goto('/demo/embed/no-sandbox');
  const src = await page.locator('#orbit-slot iframe').getAttribute('src');
  const login = new URL('/login/embed', src);
  login.searchParams.set('return_to', 'https://attacker.example/');
  await page.goto(login.href);
  await page.getByRole('button', { name: 'Continue as Elena' }).click();
  await expect(page.locator('#status')).toHaveText(
    'Login could not finish. The return address is not the shop.',
  );
  await expect(page).toHaveURL(login.href);
});

test('the embed page fits a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/demo/embed/user-activation');
  await expect(
    frame(page).getByRole('heading', { name: 'Sign in to Fern & Co.' }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: 'test-results/embed-mobile.png',
    fullPage: true,
  });
});
