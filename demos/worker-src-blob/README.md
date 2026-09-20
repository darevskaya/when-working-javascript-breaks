# worker-src: Blob workers

The page draws a Mandelbrot set in a Worker. `workerFactory()` in
`worker-factory.js` is the only code that starts a Worker.

- `/demo/worker-src-blob/blob-allowed`: `worker-src 'self' blob:`. The Blob worker
  renders.
- `/demo/worker-src-blob/blob-blocked`: `worker-src 'self'`. The browser blocks the Blob
  URL, and the canvas stays empty.
- `/demo/worker-src-blob/module-worker`: the same policy. The worker starts from a module file
  on the page origin, and the fractal renders.

`npm run lint` flags the Blob worker in `worker-factory.js`. The Semgrep rule
follows the Blob URL through variables.

## Two Playwright configurations

The tests in `test-csp/` open one page and replace its
`Content-Security-Policy` header from Playwright. `page.route()` fetches the
response, puts the policy of the configuration on it, and passes it to the
browser. The page and the server stay the same, so the header is the only
difference between the two runs.

The page also records every violation twice: from the
`securitypolicyviolation` event on the document, and from a
`ReportingObserver` that watches reports of type `csp-violation`. Each test
attaches the list as `csp-violations.json` and adds one annotation per
violation, so the HTML report names the directive and the blocked URL.

- `npm run test:permissive`: `worker-src 'self' blob:`. The worker starts and
  the test passes.
- `npm run test:strict`: `worker-src 'self'`. The browser blocks the worker and
  the test fails. The report holds the violations, a screenshot, and a trace.

Each run writes its own report under `playwright-report/<name>`. To read the
failing one, run `npx playwright show-report playwright-report/strict`.
