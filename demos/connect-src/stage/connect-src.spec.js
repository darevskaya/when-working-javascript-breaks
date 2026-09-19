import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Keep the demo local: no DNS, credentials, or live identity service.
  await page.route('https://identity.customer.com/profile', (route) =>
    route.fulfill({ json: { name: 'Elena' } }),
  );

  // Print the browser's CSP error next to the failing assertion.
  page.on('console', (message) => {
    if (message.type() === 'error') console.log(message.text());
  });
});

test('profile loads with no policy', async ({ page }) => {
  await page.goto('/demo/connect-src');
  await expect(page.getByText('Profile loaded')).toBeVisible();
});

test('profile loads under connect-src', async ({ page }) => {
  // A policy must arrive on the document response, so replace the response
  // headers here. `extraHTTPHeaders` sets request headers and does not work.
  await page.route('**/demo/connect-src', async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'Content-Security-Policy': "connect-src 'self' https://api.example.com",
      },
    });
  });

  await page.goto('/demo/connect-src');
  await expect(page.getByText('Profile loaded')).toBeVisible();
});
