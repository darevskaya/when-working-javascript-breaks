# When Working JavaScript Breaks

Demo code for a conference talk. Each page shows working JavaScript that breaks
under a browser security policy. Each demo has one URL per mode, and the modes
differ in one response header. The page itself does not change.

After `npm start`, open the index at http://127.0.0.1:4173. It links to every
demo in every mode, and each link opens a new tab.

Use Node.js 22 or later.

All demo source files live in `demos/`, grouped by feature:

```text
demos/
  index.html   Links to every demo in every mode
  sdk/         Shop pages, SDK widget, SDK frame and loader, and CSS
  calculator/  HTML, CSS, page script, and dialog source
  fractal/     HTML, CSS, page script, worker, and worker factory
  coop/        HTML, CSS, and scripts for the app, callback, and identity provider
  profile/     HTML and page script
  common/      Shared styles
  tests/       Playwright demo tests and configuration
```

`server.js` maps browser URLs to these files. `dist/` holds the two generated
calculator bundles. The application's test suite lives in `test/`.

Run `npm run lint` to find the lines that the demos depend on. ESLint reports six
errors in three files: one in the calculator, one in the fractal worker factory,
and four in the SDK widget. The widget has two `innerHTML` assignments, and two
rules flag each one. The command fails, and that is the point.

`eslint.config.js` holds six rules, and each rule matches a policy directive. A
seventh rule allows `new Worker` only in `demos/fractal/worker-factory.js`. That
file is the only lint exception, and the six policy rules still apply to it.

The configuration also uses `eslint-plugin-no-unsanitized`. It flags more markup
sinks, for example `outerHTML` and `insertAdjacentHTML()`. But it looks for XSS,
so it allows a constant string, and Trusted Types still blocks that string. For
this reason, the `innerHTML` rule stays.

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
restricted shop sends `Content-Security-Policy: require-trusted-types-for`. The
calculator sends `Content-Security-Policy: script-src`. The fractal sends
`Content-Security-Policy: worker-src`. The host-coop page sends
`Cross-Origin-Opener-Policy`. On the restricted popup page, select the popup's
`/login/restricted` request, which sends `Cross-Origin-Opener-Policy`.

## Semgrep

Semgrep is a Python tool, so npm does not install it. Install it with
`pip install semgrep`. The npm scripts run it through `semgrep.js`. If
`semgrep` is not on your `PATH`, that script finds it in the user `Scripts` or
`bin` folder of pip. Then run the two scans:

```sh
npm run scan:registry
npm run scan
```

`npm run scan:registry` runs the public `p/javascript`, `p/xss`, and
`p/default` rules. It finds nothing in `demos/`. These rules look for untrusted
input that reaches a dangerous call, and the demo code has none. It still breaks
under a browser policy.

`npm run scan` runs the project rules in `.semgrep.yml`. Each rule names the
policy that blocks the code: Trusted Types, `script-src`, `worker-src`, COOP,
and the iframe sandbox. The scan finds ten lines and fails, like `npm run lint`.
The `worker-src` rule follows the Blob URL through variables. The ESLint rule
sees one expression at a time, so it flags every Worker path that is not a
literal.

`npm test` also runs `test/semgrep.test.js`. It skips both tests when
`semgrep.js` cannot find Semgrep.

## SDK widget

http://127.0.0.1:4173/demo/sdk/permissive

The page is a customer's checkout. The Orbit ID SDK renders a sign-in widget
into it with `innerHTML`. The restricted page sends one header,
`require-trusted-types-for 'script'`:

http://127.0.0.1:4173/demo/sdk/restricted

The widget stays at "Loading sign-in…". The console shows a `TypeError` on the
`innerHTML` assignment. The SDK code is the same on both pages.

The fixed page sends the same header, but it loads `sdk-safe.js`:

http://127.0.0.1:4173/demo/sdk/fixed

This widget builds its markup with DOM APIs and `textContent`. It has no
`innerHTML`, so lint passes, and the widget renders under Trusted Types.

## SDK frame

http://127.0.0.1:4173/demo/embed/no-sandbox

The same shop embeds the Orbit ID frame from the provider server on port 4174.
The login is a redirect. When you select "Continue with Orbit ID", the frame
sets `window.top.location` to the Orbit ID login. After you continue as Elena,
Orbit ID sends the whole page back to the shop. The frame and the shop exchange
no messages.

These pages send no policy. They differ in the `sandbox` attribute that the
shop puts on the iframe, and the page shows that attribute.

http://127.0.0.1:4173/demo/embed/no-top-navigation

This sandbox is `allow-scripts allow-same-origin`. The frame renders, and its
button works. The failure waits until the click. The redirect then throws a
`SecurityError` inside the frame, and the console shows "Unsafe attempt to
initiate navigation". The shop page sees no error.

http://127.0.0.1:4173/demo/embed/user-activation

This sandbox adds `allow-top-navigation-by-user-activation`, and the login
works again. This token allows a redirect only in response to a click.
Chrome also blocks a redirect without a click from a cross-origin frame that
has no sandbox. Only `allow-top-navigation` allows it.

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
shows the name. If you close the popup without a login, the app reports "Login
canceled by the user."

Now open the host-coop page. It sends `Cross-Origin-Opener-Policy: same-origin`
on the app page, and the provider sends nothing:

http://127.0.0.1:4173/demo/coop/host-coop

The popup opens, but COOP separates it from the app. The app sees
`popup.closed: true` at once and reports "Login canceled by the user." The
popup is still open, and the provider reports `window.opener: null`. Nobody
canceled anything.

The restricted page sends no header itself. It opens a provider login that
sends `Cross-Origin-Opener-Policy: same-origin`:

http://127.0.0.1:4173/demo/coop/restricted

The result is the same. The provider changed its own header, and the app and
the customer changed nothing. All modes serve the same app and provider HTML
and JavaScript.

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

## Popup login with BroadcastChannel

http://127.0.0.1:4173/demo/broadcast/permissive

This is the same popup login, without window references and without a token
in the browser. It uses the Backend for Frontend (BFF) pattern from
[RFC 10017](https://www.rfc-editor.org/rfc/rfc10017), section 6.1:

1. The app opens a popup at `/bff/login` on the app origin, with `noopener`
   and `noreferrer`. `bff.js` makes a `state`
   value and a PKCE verifier, keeps both on the server, and sends the popup to
   Orbit ID with the hash of the verifier.
2. You continue as Elena. `orbit-auth.js`, the fake Orbit ID server, sends the
   popup back to `/bff/callback` with a one-time code.
3. The BFF exchanges the code for a token, server to server, with the client
   secret and the PKCE verifier. It keeps the token and sets an `HttpOnly`,
   `SameSite=Strict` session cookie.
4. The popup goes to `/demo/broadcast/callback`. That page posts only
   `{ type: 'login-complete' }` on a `BroadcastChannel` and closes the popup.
5. The app page hears "done" and calls `/bff/user` with an `X-CSRF` header.
   The browser sends the cookie, and the BFF answers with the user name.

A channel reaches every page of the same origin, so the message arrives even
when COOP cuts the window references:

http://127.0.0.1:4173/demo/broadcast/host-coop

http://127.0.0.1:4173/demo/broadcast/restricted

Because of `noopener`, the popup reports `window.opener: null` in every mode,
and `window.open()` returns `null`. The page shows that value. No window
relationship exists, so COOP has nothing to cut, and the login needs none. The
cost: the app cannot see a blocked popup or a cancel. It asks the user to allow
popups if no window opened.

The channel carries no secret. Any page of the origin can post "done", but the
app then asks the BFF, and without a session the app keeps waiting. The session
cookie is not `Secure` here, because the demo runs over HTTP. In production,
use HTTPS, `Secure`, and the `__Host-` cookie name prefix.

For an SDK, the BFF and the callback page must be on the customer's origin, so
the customer must run them. Libraries that do this:
[Duende BFF](https://docs.duendesoftware.com/bff/architecture/) and the
[Curity token handler](https://curity.io/resources/learn/the-token-handler-pattern/).
The OpenStreetMap login library moved its popup to `BroadcastChannel` when its
provider added COOP:
[osm-auth pull request 138](https://github.com/osmlab/osm-auth/pull/138).

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
