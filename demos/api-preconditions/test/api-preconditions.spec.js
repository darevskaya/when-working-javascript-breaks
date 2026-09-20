import { test, expect } from '@playwright/test';

const onLoad = (id) => `#api-${id} .result >> nth=0`;
const fromClick = (id) => `#api-${id} .result >> nth=1`;

test('the same calls, with and without a click', async ({ page }) => {
  await page.goto('/demo/api-preconditions/plain');
  // No policy, no click: a secure context is all these three ask for.
  await expect(page.locator(onLoad('digest'))).toHaveText('256-bit digest');
  await expect(page.locator(onLoad('service-worker'))).toHaveText('scope /');
  await expect(page.locator(onLoad('storage'))).toContainText('quota');
  // Fullscreen needs transient activation, so the load pass cannot have it.
  await expect(page.locator(onLoad('fullscreen'))).toContainText('TypeError');
  await page.click('#api-fullscreen .run');
  await expect(page.locator(fromClick('fullscreen'))).toHaveText(
    'entered and left fullscreen',
  );
  // Sound needs sticky activation: the state changes after the first click.
  await expect(page.locator(onLoad('audio'))).toHaveText('state suspended');
  await page.click('#api-audio .run');
  await expect(page.locator(fromClick('audio'))).toHaveText('state running');
  // Shared memory needs cross-origin isolation, which this page does not have.
  await expect(page.locator(onLoad('shared-memory'))).toContainText(
    'ReferenceError',
  );
  await expect(page.locator('#isolated')).toHaveText('no');
  await page.screenshot({ path: 'test-results/plain.png', fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test('two headers turn SharedArrayBuffer on', async ({ page }) => {
  await page.goto('/demo/api-preconditions/isolated');
  await expect(page.locator('#isolated')).toHaveText('yes');
  await expect(page.locator(onLoad('shared-memory'))).toHaveText(
    '16 shared bytes',
  );
});

test('Permissions-Policy blocks four of the eleven calls', async ({ page }) => {
  await page.goto('/demo/api-preconditions/locked-down');
  const policy = /permissions policy/i;
  for (const id of ['clipboard', 'fullscreen', 'geolocation', 'wake-lock']) {
    await expect(page.locator(onLoad(id))).toHaveText(policy);
  }
  // The policy names four features, and it leaves the rest alone.
  await expect(page.locator(onLoad('digest'))).toHaveText('256-bit digest');
  await page.screenshot({
    path: 'test-results/locked-down.png',
    fullPage: true,
  });
});

test.describe('with the clipboard permission granted', () => {
  test.use({ permissions: ['clipboard-write'] });

  test('the click is what the clipboard call still waits for', async ({
    page,
  }) => {
    await page.goto('/demo/api-preconditions/plain');
    await expect(page.locator('#api-clipboard .permission')).toHaveText(
      'permission: granted',
    );
    await expect(page.locator(onLoad('clipboard'))).toContainText(
      'NotAllowedError',
    );
    await page.click('#api-clipboard .run');
    await expect(page.locator(fromClick('clipboard'))).toHaveText(
      'text written',
    );
  });
});
