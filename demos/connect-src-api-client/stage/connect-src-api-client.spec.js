import { test, expect } from '@playwright/test';

// The customer sends connect-src, not this server. A policy must arrive on
// the document response, so these tests replace the response headers here.
// `extraHTTPHeaders` sets request headers and does not work.
const pageUrl = '/demo/connect-src-api-client/api-calls';

test.beforeEach(async ({ page }) => {
  // Print the browser's CSP error next to the failing assertion.
  page.on('console', (message) => {
    if (message.type() === 'error') console.log(message.text());
  });
});

test('the profile loads under the contract policy', async ({ page }) => {
  await page.goto(pageUrl);
  await expect(page.locator('#profile')).toHaveText('Loaded: Elena');
});

test('the profile loads under a narrower customer policy', async ({ page }) => {
  // The customer allows the page origin and nothing else. The API origin is
  // in contract.js, but this customer never listed it, so the browser
  // refuses the call that the contract allows.
  await page.route(`**${pageUrl}`, async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'Content-Security-Policy': "connect-src 'self'",
      },
    });
  });

  await page.goto(pageUrl);
  await expect(page.locator('#profile')).toHaveText('Loaded: Elena');
});
