import { test, expect } from '@playwright/test';

// The strict project intentionally fails.
const pagePath = '/demo/playwright-policies/allowed';

test.beforeEach(async ({ page }, testInfo) => {
  const { csp } = testInfo.project.use;

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

test('the worker runs under the policy of this project', async ({ page }) => {
  await page.goto(pagePath);
  await expect(page.locator('#worker-status')).toContainText(
    'The worker replied: Hello, Playwright.',
  );
});

test('the page loads inside an iframe under the policy of this project', async ({
  page,
}, testInfo) => {
  test.fail(
    testInfo.project.name === 'strict',
    "frame-ancestors 'none' refuses the page inside an iframe.",
  );
  await page.goto('/');
  const title = await page.evaluate(
    (src) =>
      new Promise((resolve) => {
        const frame = document.createElement('iframe');
        frame.src = src;
        frame.addEventListener('load', () => {
          try {
            resolve(frame.contentDocument?.title ?? null);
          } catch {
            resolve(null);
          }
        });
        document.body.append(frame);
      }),
    pagePath,
  );
  expect(title).toBe('A Blob worker under policy');
});
