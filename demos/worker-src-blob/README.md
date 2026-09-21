# worker-src: Blob workers

The page draws a Mandelbrot set in a Worker. `workerFactory()` in
`worker-factory.js` is the only code that starts a Worker.

- `/demo/worker-src-blob/blob-allowed`: `worker-src 'self' blob:`. The Blob worker
  renders.
- `/demo/worker-src-blob/blob-blocked`: `worker-src 'self'`. The browser blocks the Blob
  URL, and the canvas stays empty.
- `/demo/worker-src-blob/module-worker`: the same policy. The worker starts from a module file
  on the page origin, and the fractal renders.

`npm run lint` flags the Blob worker in `worker-factory.js`.

## Two Playwright projects

`test/csp-headers.spec.js` opens one page and replaces its
`Content-Security-Policy` header from Playwright. `page.route()` fetches the
response, puts the policy of the project on it, and passes it to the browser.
The page, the server and the test stay the same, so the header is the only
difference between the two runs.

The test watches the reports with a `ReportingObserver`. The observer takes
no `types` option, so it collects every kind of report the browser makes, not
only `csp-violation`. This is the report the browser would send to a reporting
endpoint, so the test reads what production monitoring reads.

To show a second kind, the test puts `Permissions-Policy: geolocation=()` on
the same response and then calls `navigator.geolocation.getCurrentPosition()`.
Both runs therefore hold a `permissions-policy-violation` report, and the
strict run holds the `csp-violation` report as well. Each test attaches the
list as `reports.json` and adds one annotation per report, so the HTML report
names the cause.

- `npm run test:permissive`: `script-src 'self'; worker-src 'self' blob:`. The
  worker starts and the test passes.
- `npm run test:strict`: `script-src 'self'`. The policy names no worker
  directive. `worker-src` falls back to `child-src`, then to `script-src`, so
  the browser blocks the Blob worker and the test fails. The report holds the
  violations, a screenshot, and a trace.

`npm test` runs the `demo` project, which holds the other tests. To read the
report of the last run, run `npx playwright show-report`.
