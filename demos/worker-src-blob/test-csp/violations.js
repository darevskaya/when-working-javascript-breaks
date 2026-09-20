// Two browser APIs report the same Content Security Policy violation. The
// securitypolicyviolation event fires on the document. A ReportingObserver
// receives the report the browser would send to a reporting endpoint.
export function watchViolations(page) {
  return page.addInitScript(() => {
    window.cspViolations = [];
    const record = (api, body) =>
      window.cspViolations.push({
        api,
        directive: body.effectiveDirective,
        blocked: body.blockedURI ?? body.blockedURL,
        disposition: body.disposition,
        policy: body.originalPolicy,
        sourceFile: body.sourceFile,
        line: body.lineNumber,
      });

    document.addEventListener('securitypolicyviolation', (event) =>
      record('securitypolicyviolation', event),
    );

    // buffered: true delivers the reports that the browser made before this
    // observer started.
    new ReportingObserver(
      (reports) => {
        for (const report of reports) record('ReportingObserver', report.body);
      },
      { types: ['csp-violation'], buffered: true },
    ).observe();
  });
}

// Reads the recorded violations out of the page.
export const readViolations = (page) =>
  page.evaluate(() => window.cspViolations ?? []).catch(() => []);

// Puts the policy and the violations into the Playwright report. The JSON
// attachment holds the detail. The annotation shows one line per violation on
// the test, so the report names the cause without a click.
export async function attachViolations(page, testInfo) {
  const policy = testInfo.project.use.csp;
  const violations = await readViolations(page);

  await testInfo.attach('csp-violations.json', {
    body: JSON.stringify({ policy, violations }, null, 2),
    contentType: 'application/json',
  });

  for (const violation of violations) {
    testInfo.annotations.push({
      type: 'csp-violation',
      description: `${violation.api}: ${violation.directive} blocked ${violation.blocked}`,
    });
  }
  return violations;
}
