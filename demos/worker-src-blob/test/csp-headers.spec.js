import { test, expect } from '@playwright/test';

// One page, two policies. playwright.config.js gives each project its own
// csp, and this file puts that policy on the response. The page, the server
// and the test stay the same in both runs, so the header is the only
// difference. The permissive project renders the fractal. The strict project
// fails, and the report holds the violation.
const pagePath = '/demo/worker-src-blob/blob-allowed';

test.beforeEach(async ({ page }, testInfo) => {
  const { csp } = testInfo.project.use;

  // Replace the headers the server sent: fetch the response, put the policy
  // of this project on it, and give it to the browser. The permissions policy
  // is the same in both projects, so both runs hold one report of that kind.
  await page.route(pagePath, async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      headers: {
        ...response.headers(),
        'content-security-policy': csp,
        'permissions-policy': 'geolocation=()',
      },
    });
  });

  // A ReportingObserver receives the reports that the browser would send to a
  // reporting endpoint. Without the types option it collects every kind the
  // browser makes, so one observer holds the worker and the geolocation
  // report. buffered: true delivers the reports made before this line.
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

// One line per report, whatever the kind.
const describe = ({ type, body }) =>
  type === 'csp-violation'
    ? `${type}: ${body.effectiveDirective} blocked ${body.blockedURL}`
    : `${type}: ${body.featureId ?? body.id ?? body.message}`;

// The JSON attachment holds the detail. The annotations show the reports on
// the test, so the HTML report names the cause without a click.
test.afterEach(async ({ page }, testInfo) => {
  const reports = await page
    .evaluate(() => window.reports ?? [])
    .catch(() => []);

  await testInfo.attach('reports.json', {
    body: JSON.stringify(
      { policy: testInfo.project.use.csp, reports },
      null,
      2,
    ),
    contentType: 'application/json',
  });
  for (const report of reports) {
    testInfo.annotations.push({
      type: 'report',
      description: describe(report),
    });
  }
});

test('the Blob worker renders the fractal', async ({ page }) => {
  await page.goto(pagePath);

  // A second violation, of another kind: the permissions policy of the
  // response forbids geolocation.
  await page.evaluate(() =>
    navigator.geolocation.getCurrentPosition(
      () => {},
      () => {},
    ),
  );

  await expect(page.locator('#status')).toHaveText('Render complete');
  await expect(page.getByRole('progressbar')).toHaveJSProperty('value', 100);
});
