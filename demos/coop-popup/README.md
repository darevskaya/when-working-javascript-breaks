# COOP: popup login

The app opens the Orbit ID login in a popup. Orbit ID redirects the popup to
`/login/callback` on the app origin. The callback page sends the result through
`window.opener.postMessage`, and then it closes the popup.

- `/demo/coop-popup/no-coop`: no COOP. The login works.
- `/demo/coop-popup/coop-on-login`: the Orbit ID login sends
  `Cross-Origin-Opener-Policy: same-origin`.

In the COOP mode, the app shows "Waiting for login…" and never changes it. The
redirect to the app origin does not restore `window.opener`. The callback page cannot reach the
app, so the popup stays open, and the app never learns that the person signed in.

`npm run lint` flags each read of `popup.closed`. `npm run stage` runs a
Playwright test that fails on purpose.
