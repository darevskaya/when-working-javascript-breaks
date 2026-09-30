# When Working JavaScript Breaks

Demo code for the Conf 42 DevSecOps 2026 talk "When Working JavaScript Breaks:
Browser Security Policies in Practice".

## Quick start

Node.js 22 or later. Run once:

```sh
npm ci
```

Start the interactive demos, then open http://127.0.0.1:4173:

```sh
npm start
```

Press Ctrl+C to stop. From another terminal: `npm run stop`.

## Demos

### COOP breaks popup login

[`demos/coop-popup`](http://127.0.0.1:4205)

The app opens the Orbit ID login in a popup. Orbit ID redirects the popup back
to `/login/callback` on the app origin, which posts the result through
`window.opener` and closes itself.

To run only this demo, run `npm start` in `demos/coop-popup`, open
http://127.0.0.1:4205, then try both links. In each tab, click **Sign in** and
then **Continue as Elena** in the popup.

| Route | What happens |
|---|---|
| `no-coop` | Login works. |
| `with-coop` | The login page sends `Cross-Origin-Opener-Policy: same-origin`. This severs `window.opener`. The callback cannot reach the app, the popup stays open, and the app shows "Waiting for login..." forever. |

`npm run stage` runs a Playwright test that fails on purpose.

---

### script-src blocks eval

[`demos/script-src-eval`](http://127.0.0.1:4203)

`renderer.js` fills `{{ ... }}` templates with `eval`. Three routes, one page:

| Route | Policy | What happens |
|---|---|---|
| `unsafe-eval-allowed` | `script-src 'self' 'unsafe-eval'` | Values render. |
| `eval-blocked` | `script-src 'self'` | `EvalError`, raw `{{ ... }}` text stays. |
| `bundle/eval-source-map` | `script-src 'self'` | Bundle also blocked. `devtool: 'eval-source-map'` wraps every module in `eval()`. |

`npm start` builds the webpack bundle first. To show the fix, swap
`devtool: 'eval-source-map'` for `devtool: 'source-map'` in
`webpack.config.js`, then run `npm start` again.

Three lint commands, each reading different files:

- `npm run lint:source` finds `eval` in `renderer.js`
- `npm run lint:build` finds `eval` in `dist/app.js` (build added it)
- `npm run lint:webpack` finds the `devtool` setting that caused it

---

### ESLint enforces worker factories

[`demos/restrict-architecture-eslint`](http://127.0.0.1:4208)

`worker-factory.js` is the only file that calls `new Worker()` or creates a
worker URL. It exposes `createWorker()`, which every other file imports and
calls. This makes worker construction an explicit architectural boundary.

| Route | What happens |
|---|---|
| `restrict-architecture-eslint` | `app.js` calls `createWorker()` twice. The worker replies with a total and status. |

`npm run lint` rejects the intentional violation in
`worker-outside-factory.js`.

---

### Trusted Types blocks innerHTML

[`demos/restrict-inner-html`](http://127.0.0.1:4201)

`require-trusted-types-for 'script'` refuses every plain string assigned to
`innerHTML`. The product label holds an `<em>` tag so you can see what each
rendering style does with it.

To run only this demo, run `npm start` in `demos/restrict-inner-html`, open
http://127.0.0.1:4201, then try the four routes in order.

| Route | What happens |
|---|---|
| `no-header` | Renders with `innerHTML`. The tag becomes an element. |
| `string` | Same code, header on. `TypeError`, preview stays in its loading state. |
| `policy` | `innerHTML = sanitizeHtml(...)`. DOMPurify strips scripts and keeps `<em>`. |
| `dom` | `createElement` and `textContent`. Renders, tag stays as text. |

Two lint commands, each allowing only one style:

- `npm run lint:forbid` allows only `renderers/dom.js`
- `npm run lint:sanitize-html` allows only `renderers/sanitize.js`

---

### Testing under security headers

[`demos/playwright-policies`](http://127.0.0.1:4204)

Shows how to run one Playwright suite under two sets of security headers.
Read the violation reports the failure carries.

| Command | Policy | Result |
|---|---|---|
| `npm run test:permissive` | `script-src 'self'; worker-src 'self' blob:` | Passes |
| `npm run test:strict` | `script-src 'self'; frame-ancestors 'none'` | Fails on purpose |

Each spec explicitly calls helpers from `test/policy.js` to intercept its
response with `page.route()`, apply the project's CSP, collect reports before
the page script runs, and attach `reports.json` to the result.

`npm run test:report` opens the HTML report of the last run.

---
