# When Working JavaScript Breaks

Demo code for a conference talk. Three pages show working JavaScript that breaks
under a browser security policy. Each demo has one URL per mode, and the modes
differ in one response header. The page itself does not change.

After `npm start`, open the index at http://127.0.0.1:4173. It links to every
demo in every mode, and each link opens a new tab.

Use Node.js 22 or later.

All demo source files live in `demos/`, grouped by feature:

```text
demos/
  index.html   Links to every demo in every mode
  calculator/  HTML, CSS, page script, and dialog source
  fractal/     HTML, CSS, page script, worker, and worker factory
  coop/        HTML, CSS, and scripts for the app and identity provider
  profile/     HTML and page script
  common/      Shared styles
  tests/       Playwright demo tests and configuration
```

`server.js` maps browser URLs to these files. `dist/` holds the two generated
calculator bundles. The application's test suite lives in `test/`.

Run `npm run lint` to find the two lines that the demos depend on. ESLint reports
one error in the calculator and one in the fractal worker factory. The command
fails, and that is the point. `eslint.config.js` holds five rules, and each rule
matches a policy directive. A sixth rule allows `new Worker` only in
`demos/fractal/worker-factory.js`. That file is the only lint exception, and the
five policy rules still apply to it.

Run `npm test` to build the bundles and test the server and the lint result.

```sh
npm ci
npm start
```

For development, run `npm run dev`. It restarts the server and rebuilds the
calculator bundles on save. Refresh the browser to see the change. Restart
`npm run dev` after you edit `webpack.config.js`. Press Ctrl+C to stop it.

`server.js` holds one route table per server. A plain row names the file to
send and nothing more. A row with braces adds the policy headers for that
route, or a generated body. One row is a function: `/reports`
receives browser reports. The server adds `Content-Type` and nothing else, so
the table is what the browser receives.

To see a header, open the browser developer tools and select Network. Reload
the page, select its document request, and read the response headers. The
calculator sends `Content-Security-Policy: script-src`. The fractal sends
`Content-Security-Policy: worker-src`. For the popup demo, select the popup's
`/login/restricted` request, which sends `Cross-Origin-Opener-Policy`.

## Calculator

http://127.0.0.1:4173/demo/calculator/permissive

The dialog compiles a formula string with `new Function`. It runs under
`script-src 'self' 'unsafe-eval'`. Open the restricted page, which sends
`script-src 'self'`, and open the calculator:

http://127.0.0.1:4173/demo/calculator/restricted

The bundle still downloads, but the browser refuses to compile the formula. The
page prints the error in red.

The eval-build page also sends `script-src 'self'`, but it loads a second bundle:

http://127.0.0.1:4173/demo/calculator/eval-build

`webpack.config.js` builds this bundle from `calculate-safe.js`, which has
regular functions and no `eval`, so lint passes. But the bundle uses the
`eval-source-map` devtool, which wraps every module in `eval()`. The browser
blocks the bundle, and the page reports that it downloaded but did not run.

## Fractal

http://127.0.0.1:4173/demo/fractal/permissive

The page builds a Worker from a Blob URL and draws a Mandelbrot set strip by
strip. `workerFactory()` in `worker-factory.js` is the only code that starts a
Worker. The page runs under `worker-src 'self' blob:`. The restricted page sends
`worker-src 'self'`, and its canvas stays empty. The browser fires a
`securitypolicyviolation` event for the blocked `blob:` URL:

http://127.0.0.1:4173/demo/fractal/restricted

The module page sends the same `worker-src 'self'`, but it starts the renderer
from `fractal-module-worker.js`. The browser loads that file from the origin of
the page, so the policy allows it, and the fractal renders:

http://127.0.0.1:4173/demo/fractal/module

## Popup login

http://127.0.0.1:4173/demo/coop/permissive

This demo starts a fake identity provider on port 4174. Sign in and continue as
Elena. The provider posts the result back through `window.opener`, and the app
shows the name. Now open the restricted page and sign in again:

http://127.0.0.1:4173/demo/coop/restricted

This page opens a provider login that sends `Cross-Origin-Opener-Policy:
same-origin`. The popup stays open, but the app reports `popup.closed: true` and
the provider reports `window.opener: null`. Login cannot complete. Both modes
serve the same provider HTML and JavaScript.

Close detached popups by hand between attempts. Use the `127.0.0.1` URLs above so the login message matches the origin
of the application. `PORT` and `PROVIDER_PORT` override the two server ports.

Run `npm run demo:coop` to demonstrate the same failure through Playwright.
The tests in `demos/tests/coop.spec.js` complete login with no policy, then add
`Cross-Origin-Opener-Policy: same-origin` to the provider response.
The second test prints `window.opener: null` and fails while waiting for
`Logged in as Elena`. The command exits with code 1.

The setup uses
[`context.route`](https://playwright.dev/docs/api/class-browsercontext#browser-context-route)
to intercept the popup's first request. Both tests open the same permissive route,
so the test supplies the header that breaks login. The regular application tests
remain in `test/browser`.

## Profile

http://127.0.0.1:4173/demo/profile

This demo tests a page under a policy that the server does not send. The route
sends no header. A Playwright test adds `connect-src 'self'
https://api.example.com` to the document response. The page calls
`https://identity.customer.com`, so the browser refuses the connection.

Run both cases with `npm run demo:csp`. One test passes, and one test fails. The
failing test prints the browser's CSP error, and the command exits with code 1.
This is an actual failure, with no `test.fail()` annotation.

A policy must arrive on the document response. Playwright's `extraHTTPHeaders`
option adds request headers, so it cannot apply a browser policy. Use
[`route.fulfill`](https://playwright.dev/docs/api/class-route#route-fulfill) to
replace the response headers instead. See `demos/tests/profile.spec.js`.

The test also returns a fake identity API response, so no request reaches a live
service. The browser still blocks the fetch before that response arrives.

To show a corrected policy, replace `https://api.example.com` in the test with
`https://identity.customer.com`, then run the command again.

These presentation tests fail on purpose. `npm test` and `npm run test:browser`
do not run them. The demo serves the page on port 4177, so it never collides
with `npm start`.

## Browser reports

Run `npm run demo:reports` to open the reporting examples in a separate Chromium window.
The launcher starts HTTPS servers on ports 4185 and 4186.
It needs OpenSSL and the Playwright Chromium installation (`npx playwright install chromium`).
On Windows, it uses OpenSSL from Git for Windows.
Set `OPENSSL` to use another executable path.

The launcher creates a temporary certificate and browser profile.
Only this browser session accepts that certificate. The system certificate store stays unchanged.
Close the browser or press Ctrl+C to stop the servers and remove the temporary files.

Select CSP, COOP, or COEP, then select an enforced or report-only policy.
Click **Trigger violation** and read the report in the server terminal.
The enforced policy blocks the action. The report-only policy permits the action and requests a report.
Close each popup after the COOP example.

The collector also saves reports in `logs/browser-reports.jsonl`.
JSONL stores one JSON object per line. Each entry includes the receipt time, delivery format, and original report.
The terminal replaces control characters and shortens long values for display.
The saved original keeps all fields. Git ignores the log directory.

The modern examples register both `Reporting-Endpoints` and the older `Report-To` header.
Both mechanisms send arrays with the `application/reports+json` content type.
The CSP policies include both `report-to` and `report-uri`.
Browsers that support `report-to` ignore `report-uri`.
The separate legacy CSP example uses only `report-uri` and sends an `application/csp-report` object.
COOP and COEP have no legacy CSP payload format.

The receiver runs at `POST /reports` on both servers.
It accepts up to 256 KiB per request and returns `204` after saving valid reports.
The original HTTP service also accepts reports, but use the HTTPS launcher for browser delivery.
The launcher uses a temporary regular profile because private browser contexts can suppress delivery.
It enables background networking and requests shorter reporting delays for the demo.
The browser still controls delivery time. Keep the server running while reports are pending.

To inspect queued reports in Chromium, open **Application → Reporting API** in the developer tools.
`npm run test:browser -- test/browser/reporting.spec.js` tests browser actions and actual delivery.
`npm test` tests both payload formats, saved output, and invalid requests.

To test the receiver directly while the HTTP server runs, use PowerShell:

```powershell
$modern = '[{"type":"coep","age":0,"url":"https://example.test/demo","body":{"type":"corp","blockedURL":"https://other.test/script.js","destination":"script","disposition":"enforce"}}]'
Invoke-WebRequest http://127.0.0.1:4173/reports -Method Post -ContentType 'application/reports+json' -Body $modern
$legacy = '{"csp-report":{"document-uri":"https://example.test/demo","effective-directive":"script-src","blocked-uri":"inline","disposition":"enforce"}}'
Invoke-WebRequest http://127.0.0.1:4173/reports -Method Post -ContentType 'application/csp-report' -Body $legacy
```

These commands send sample payloads. They do not trigger browser violations.
See the [Reporting API specification](https://www.w3.org/TR/reporting-1/),
[CSP specification](https://www.w3.org/TR/CSP3/), and
[Chrome Reporting API guide](https://developer.chrome.com/docs/capabilities/web-apis/reporting-api)
for the reporting formats and header configuration.
