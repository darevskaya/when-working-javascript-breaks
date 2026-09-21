# COOP: popup login

The app opens the Orbit ID login in a popup. The popup sends the result back
through `window.opener`.

- `/demo/coop-popup/no-coop`: no COOP. The login works.
- `/demo/coop-popup/coop-on-app`: the app page sends
  `Cross-Origin-Opener-Policy: same-origin`.
- `/demo/coop-popup/coop-on-login`: the Orbit ID login sends the same header.

In both COOP modes, the app sees `popup.closed: true` at once, and it reports
"Login canceled by the user", while the popup is still open. The login window
has no `window.opener`, so Continue sends the result nowhere. The window
closes, and the app never learns that the person signed in.

`npm run lint` flags each read of `popup.closed`. `npm run stage` runs a
Playwright test that fails on purpose.
