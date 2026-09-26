import { test } from '@playwright/test';

// Puts the csp of the project on pagePath and collects every report.
export function usePolicy(pagePath) {
  test.beforeEach(async ({ page }, testInfo) => {
    const { csp } = testInfo.project.use;

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

    await page.addInitScript(() => {
      window.reports = [];
      new ReportingObserver(
        (reports) => {
          for (const report of reports) window.reports.push(report.toJSON());
        },
        { buffered: true },
      ).observe();
    });
  });

  test.afterEach(async ({ page }, testInfo) => {
    await page.waitForTimeout(Number(process.env.END_PAUSE ?? 0));

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
}
