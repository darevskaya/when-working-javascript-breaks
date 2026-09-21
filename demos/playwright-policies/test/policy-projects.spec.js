import { test, expect } from '@playwright/test';

// The strict project intentionally fails.
const pagePath = '/demo/playwright-policies/allowed';

test.beforeEach(async ({ page }, testInfo) => {
  const { csp } = testInfo.project.use;

  // The test observes the reports, so the page code stays unchanged.
  // With no types option, the observer collects every kind of report.
  await page.addInitScript(() => {
    window.reports = [];
    new ReportingObserver(
      (reports) => {
        for (const report of reports) window.reports.push(report.toJSON());
      },
      { buffered: true },
    ).observe();
  });

  await page.route(pagePath, async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      headers: {
        ...response.headers(),
        'content-security-policy': csp,
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
        reports,
      },
      null,
      2,
    ),
    contentType: 'application/json',
  });
  for (const { type, body } of reports) {
    testInfo.annotations.push({
      type: 'report',
      description:
        type === 'csp-violation'
          ? `${type}: ${body.effectiveDirective} blocked ${body.blockedURL}`
          : `${type}: ${body.featureId ?? body.message}`,
    });
  }
});

test('the worker runs under the policy of this project', async ({ page }) => {
  await page.goto(pagePath);
  await expect(page.locator('#worker-status')).toContainText(
    'The worker replied: Hello, Playwright.',
  );
});
