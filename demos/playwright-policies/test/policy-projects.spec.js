import { test, expect } from '@playwright/test';

// One page, two policies. playwright.config.js gives each project its own csp
// and permissionsPolicy, and this file puts them on the response. The page,
// the script, the server and the test stay the same in both runs, so the
// headers are the only difference.
//
// The permissive project passes. The strict project fails on purpose, and the
// HTML report holds the violation reports, a screenshot and a trace.
const pagePath = '/demo/playwright-policies/allowed';

test.beforeEach(async ({ page }, testInfo) => {
  const { csp, permissionsPolicy } = testInfo.project.use;

  // Replace the headers the server sent: fetch the response, put the policy
  // of this project on it, and give it to the browser.
  await page.route(pagePath, async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      headers: {
        ...response.headers(),
        'content-security-policy': csp,
        'permissions-policy': permissionsPolicy,
      },
    });
  });
});

// The JSON attachment holds the detail. The annotations show the reports on
// the test, so the HTML report names the cause without a click.
test.afterEach(async ({ page }, testInfo) => {
  const reports = await page
    .evaluate(() => window.reports ?? [])
    .catch(() => []);

  await testInfo.attach('reports.json', {
    body: JSON.stringify(
      {
        csp: testInfo.project.use.csp,
        permissionsPolicy: testInfo.project.use.permissionsPolicy,
        reports,
      },
      null,
      2,
    ),
    contentType: 'application/json',
  });
  for (const report of reports) {
    testInfo.annotations.push({
      type: 'report',
      description: `${report.type}: ${report.body.effectiveDirective ?? report.body.featureId ?? ''}`,
    });
  }
});

test('both features work under the policy of this project', async ({
  page,
}) => {
  await page.goto(pagePath);
  await expect(page.locator('#worker-status')).toContainText(
    'The worker replied: Hello, Playwright.',
  );
  await expect(page.locator('#geolocation-status')).toHaveText(
    'The permissions policy allows geolocation.',
  );
});
