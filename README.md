# When Working JavaScript Breaks

Demo code for a conference talk. Three pages show working JavaScript that breaks
under a browser security policy. Each page has a switch that changes one response
header. The page itself does not change.

Use Node.js 22 or later.

```sh
npm ci
npm start
```

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
