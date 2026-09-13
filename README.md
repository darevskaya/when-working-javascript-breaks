# When Working JavaScript Breaks

Demo code for a conference talk. Three pages show working JavaScript that breaks
under a browser security policy. Each page has a switch that changes one response
header. The page itself does not change.

Use Node.js 22 or later.

All demo source files live in `demos/`, grouped by feature:

```text
demos/
  calculator/  HTML, CSS, page script, and dialog source
  fractal/     HTML, CSS, page script, and worker
  coop/        HTML, CSS, and scripts for the app and identity provider
  profile/     HTML and page script
  common/      Shared styles
  tests/       Playwright demo tests and configuration
```

`server.js` maps browser URLs to these files. `dist/` holds the generated
calculator bundle. The application's test suite lives in `test/`.

Run `npm run lint` to find the two lines that the demos depend on. ESLint reports
one error in the calculator and one in the fractal. The command fails, and that is
the point. `eslint.config.js` holds five rules, and each rule matches a policy
directive. The demo files keep their code, with no lint exceptions.

Run `npm test` to build the bundle and test the server and the lint result.

```sh
npm ci
npm start
```

For development, run `npm run dev`. It restarts the server and rebuilds the
calculator bundle on save. Refresh the browser to see the change. Restart
`npm run dev` after you edit `webpack.config.js`. Press Ctrl+C to stop it.

`server.js` holds one route table per server. Each row names the file to send
and the single policy header to send with it. The server adds `Content-Type`
and nothing else, so the table is what the browser receives.

To see a header, open the browser developer tools and select Network. Reload
the page, select its document request, and read the response headers. The
calculator sends `Content-Security-Policy: script-src`. The fractal sends
`Content-Security-Policy: worker-src`. For the popup demo, select the popup's
`/login/restricted` request, which sends `Cross-Origin-Opener-Policy`.

## Calculator

http://127.0.0.1:4173/demo/calculator

The dialog compiles a formula string with `new Function`. It runs under
`script-src 'self' 'unsafe-eval'`. Select `script-src 'self'` and open the
calculator again. The bundle still downloads, but the browser refuses to compile
the formula. The page prints the error in red.

## Fractal

http://127.0.0.1:4173/demo/fractal

The page builds a Worker from a Blob URL and draws a Mandelbrot set strip by
strip. It runs under `worker-src 'self' blob:`. Select `worker-src 'self'` and
the canvas stays empty. The browser fires a `securitypolicyviolation` event for
the blocked `blob:` URL.

## Popup login

http://127.0.0.1:4173/demo/coop

This demo starts a fake identity provider on port 4174. Sign in and continue as
Elena. The provider posts the result back through `window.opener`, and the app
shows the name. Now select the provider's `Cross-Origin-Opener-Policy:
same-origin` header and sign in again. The popup stays open, but the app reports
`popup.closed: true` and the provider reports `window.opener: null`. Login cannot
complete. Both modes serve the same provider HTML and JavaScript.

The switch affects the next popup. Close detached popups by hand between
attempts. Use the `127.0.0.1` URLs above so the login message matches the origin
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
