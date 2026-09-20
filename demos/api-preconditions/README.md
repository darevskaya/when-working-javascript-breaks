# What each API needs before it runs

Eleven web APIs run on one page. The code is the same on every page of this
demo. Only the response headers and the user activation change, so each row
shows which assumption the browser refused.

A precondition is a fact about the page that an API checks before it works.
This demo covers five of them:

- a secure context, which means HTTPS, `localhost`, or `127.0.0.1`
- user activation, either transient (a recent click) or sticky (any click)
- a user permission, such as geolocation
- a `Permissions-Policy` directive from the server
- cross-origin isolation, which needs COOP and COEP together

## The three modes

Open `/`, then pick a mode. Each mode is the same page with different headers:

1. `plain`: no extra headers.
2. `locked-down`: `Permissions-Policy: geolocation=(), fullscreen=(), screen-wake-lock=(), clipboard-write=()`.
3. `isolated`: `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp`.

Each row runs twice. The load pass runs with no user activation. The button
runs the same call from a click.

## What each API asks for

The `needs` lines in `preconditions.js` come from the MDN page in the last
column.

| Call                               | Needs                                                       | MDN                                                         |
| ---------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------- |
| `crypto.subtle.digest()`           | secure context                                              | `Web/API/SubtleCrypto/digest`                               |
| `serviceWorker.register()`         | secure context, same-origin script                          | `Web/API/ServiceWorkerContainer/register`                   |
| `storage.estimate()`               | secure context                                              | `Web/API/StorageManager/estimate`                           |
| `clipboard.writeText()`            | secure context, transient activation                        | `Web/API/Clipboard/writeText`                               |
| `clipboard.writeText()` in a timer | transient activation that still holds                       | `Web/Security/Defenses/User_activation`                     |
| `requestFullscreen()`              | transient activation, `fullscreen` policy                   | `Web/API/Element/requestFullscreen`                         |
| `getCurrentPosition()`             | secure context, user permission, `geolocation` policy       | `Web/API/Geolocation/getCurrentPosition`                    |
| `wakeLock.request()`               | secure context, visible document, `screen-wake-lock` policy | `Web/API/WakeLock/request`                                  |
| `new SharedArrayBuffer()`          | secure context, cross-origin isolation                      | `Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer` |
| `new AudioContext()`               | sticky activation before it makes sound                     | `Web/Media/Guides/Autoplay`                                 |
| `Notification.requestPermission()` | secure context, and a user gesture in Chrome and Safari     | `Web/API/Notification/requestPermission_static`             |

The default allowlist of `fullscreen`, `geolocation`, and `screen-wake-lock` is
`self`. The top document and same-origin frames get the feature. A cross-origin
frame needs both the header and the `allow` attribute on the frame.

## What the test browser does

The Playwright tests record the behavior of headless Chromium. Four results
differ from a plain reading of the documentation:

- The clipboard call fails during the load pass even when the test grants the
  `clipboard-write` permission. The same call from a click writes the text.
- The clipboard call inside a one second timer succeeds. Transient activation
  lasts about five seconds in Chrome, so only lint sees the risk.
- `navigator.permissions.query({ name: 'fullscreen' })` throws in Chromium, so
  the page prints that the browser cannot report that state.
- The screen wake lock request fails in headless Chromium with no policy in
  play. A browser window with a visible tab grants it.

This demo runs on `http://127.0.0.1:4173`, which is a secure context. To watch
the secure-context rows fail, open the same server through the LAN address of
your machine, for example `http://192.168.1.10:4173`.

## What lint finds

`npm run lint` fails on purpose. Two lines in `preconditions.js` break the
rules in `eslint.config.js`:

1. `if (navigator.wakeLock)` treats feature detection as a precondition check.
   The property exists, and the call still fails on a policy, on the visibility
   state, or on a flat battery.
2. `setTimeout(() => navigator.clipboard.writeText(...), 1000)` puts a call
   that needs transient activation behind a timer. The activation can expire
   first.

## Files

- `preconditions.js`: the eleven calls, each with its `needs` lines and its
  MDN link.
- `routes.js`: the three modes and their headers. The server and the page both
  read this list.
- `app.js`: the load pass, the buttons, and the environment panel.
- `server.js`: the route table.
