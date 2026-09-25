import { test, expect } from '@playwright/test';

const pagePath = '/demo/playwright-policies/allowed';

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

test('the worker runs under the policy of this project', async ({ page }) => {
  await page.goto(pagePath);
  await expect(page.locator('#worker-status')).toContainText(
    'The worker replied: Hello, Playwright.',
  );
});

test('the page loads inside the iframe under strict policy', async ({
  page,
}, testInfo) => {
  test.fail(
    testInfo.project.name === 'strict',
    "frame-ancestors 'none' refuses the page inside an iframe.",
  );
  await page.goto('/');
  const pageLoadedInIframe = await page.evaluate(
    ({ src, expectedTitle }) =>
      new Promise((resolve) => {
        const iframe = document.createElement('iframe');
        iframe.src = src;
        iframe.addEventListener('load', () => {
          // A blocked iframe still fires "load", but with an error page
          // that the parent cannot read.
          let loadedTitle = null;
          try {
            loadedTitle = iframe.contentDocument?.title ?? null;
          } catch {}
          resolve(loadedTitle === expectedTitle);
        });
        document.body.append(iframe);
      }),
    { src: pagePath, expectedTitle: 'A Blob worker under policy' },
  );
  expect(pageLoadedInIframe, 'the page loads inside the iframe').toBe(true);
});
