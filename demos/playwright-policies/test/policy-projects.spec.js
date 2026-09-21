import { test, expect } from '@playwright/test';

// The strict project intentionally fails.
const pagePath = '/demo/playwright-policies/allowed';

test.beforeEach(async ({ page }, testInfo) => {
  const { csp, permissionsPolicy } = testInfo.project.use;

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

// Annotations expose causes without opening the attachment.
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
