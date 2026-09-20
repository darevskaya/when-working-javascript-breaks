import { test, expect } from '@playwright/test';
import { recordViolations } from '../../common/test-helpers.js';

const card = (page) => page.getByRole('region', { name: 'Sign in' });

// Both pages render the same sign-in card, and both refuse a policy name.
// The shot holds the card before the click, next to the refused policy line.
async function signIn(page, shot) {
  await expect(
    card(page).getByRole('heading', { name: 'Sign in to Fern & Co.' }),
  ).toBeVisible();
  await page.screenshot({ path: `test-results/${shot}.png` });
  await card(page)
    .getByRole('button', { name: 'Continue with Orbit ID' })
    .click();
  await expect(
    card(page).getByRole('heading', { name: 'Signed in as Elena' }),
  ).toBeVisible();
}

test('no policy: the widget builds every node, and no policy exists', async ({
  page,
}) => {
  await recordViolations(page);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error));
  await page.goto('/demo/trusted-types/no-policy');
  // trusted-types 'none' refuses the policy name of the widget.
  await expect(
    page.getByText('refuses a policy named "orbit-widget"'),
  ).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => window.cspViolations))
    .toContainEqual(expect.objectContaining({ directive: 'trusted-types' }));
  await signIn(page, 'widget-no-policy');
  expect(errors).toEqual([]);
});

test('one policy: setHTML() writes the markup, and other names fail', async ({
  page,
}) => {
  await recordViolations(page);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error));
  await page.goto('/demo/trusted-types/one-policy');
  // The list names orbit-widget, so the second name fails.
  await expect(
    page.getByText('refuses a policy named "shop-widget"'),
  ).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => window.cspViolations))
    .toContainEqual(expect.objectContaining({ directive: 'trusted-types' }));
  // setHTML escaped the & in the site name, and the page shows it as &.
  await signIn(page, 'widget-one-policy');
  expect(errors).toEqual([]);

  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: 'test-results/widget-mobile.png' });
});
