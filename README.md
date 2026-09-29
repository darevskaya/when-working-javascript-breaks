# When Working JavaScript Breaks

Demo code for a conference talk. Each demo shows working JavaScript that breaks
under a browser security policy.

## Quick start

Node.js 22 or later. Run once:

```sh
npm ci
```

Start all demos, then open http://127.0.0.1:4173:

```sh
npm start
```

Press Ctrl+C to stop. From another terminal: `npm run stop`.

## Demos

### restrict-inner-html (port 4201)

`require-trusted-types-for 'script'` refuses every plain string assigned to
`innerHTML`. The Orbit ID widget has three render styles. The shop name holds a
`<em>` tag so you can see what each style does with it.

| Route | What happens |
|---|---|
| `no-header` | Renders with `innerHTML`. The tag becomes an element. |
| `string` | Same code, header on. `TypeError`, widget stays empty. |
| `policy` | `innerHTML = sanitizeHtml(...)`. DOMPurify strips scripts and keeps `<em>`. |
| `dom` | `createElement` and `textContent`. Renders, tag stays as text. |

Two lint commands, each allowing exactly one style:

- `npm run lint:forbid` passes only `render-with-dom.js`
- `npm run lint:sanitize-html` passes only `render-with-policy.js`

---

### script-src-eval (port 4203)

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

### playwright-policies (port 4204)

Shows how to run one Playwright suite under two sets of security headers and
read the violation reports the failure carries.

| Command | Policy | Result |
|---|---|---|
| `npm run test:permissive` | `script-src 'self'; worker-src 'self' blob:` | Passes |
| `npm run test:strict` | `script-src 'self'; frame-ancestors 'none'` | Fails on purpose |

`test/policy.js` intercepts each response with `page.route()` and puts the
project's CSP on it. It also adds a `ReportingObserver` before the page
script runs, so each test result carries a `reports.json` attachment and one
annotation per report.

`npm run test:report` opens the HTML report of the last run.

---

### coop-popup (port 4205, identity provider on 4305)

The app opens the Orbit ID login in a popup. Orbit ID redirects the popup back
to `/login/callback` on the app origin, which posts the result through
`window.opener` and closes itself.

| Route | What happens |
|---|---|
| `no-coop` | Login works. |
| `coop-on-login` | The login page sends `Cross-Origin-Opener-Policy: same-origin`. This severs `window.opener`. The callback cannot reach the app, the popup stays open, and the app shows "Waiting for login..." forever. |

`npm run stage` runs a Playwright test that fails on purpose.

---

### restrict-architecture-eslint (port 4208, API on 4308)

Two ESLint rules enforce that `api-client.js` is the only file that calls
`fetch`, and `config.js` is the only file that names an origin. The server
builds the `connect-src` header from the same `config.js`, so the header and
the code cannot drift apart.

| Route | Policy | What happens |
|---|---|---|
| `from-config` | `connect-src 'self'` plus origins from `config.js` | Both API calls load. |
| `narrow-policy` | `connect-src 'self'` | Both calls blocked. Two `connect-src` violations. |

`npm run lint` passes. To watch a rule fire, add `fetch('/profile')` or
`const host = 'https://api.example.com'` to `app.js`.

---

### reporting-api (port 4209, second origin on 4309)

CSP, COOP, and COEP examples in enforce and report-only modes. The browser
sends each violation to `/reports` and the terminal prints it.

The browser delivers reports only over HTTPS. `npm start` in this folder opens
a Chromium window on a local HTTPS server with a throwaway certificate. Reports
are also saved to `logs/browser-reports.jsonl`. The hub page links to the plain
HTTP pages for browsing the routes.

---

### worker-src-eslint (port 4210)

Three ESLint rules apply. `createWorker()` in `worker-client.js` is the only
place that calls `new Worker`. `config.js` is the only file that names a worker
script, and it names only the allowed script. No file builds a worker from a
Blob URL. The server builds the `worker-src` header from the same `config.js`.

| Route | Policy | What happens |
|---|---|---|
| `from-config` | `worker-src <origin>/tasks.worker.js` | Worker replies to both calls. |
| `narrow-policy` | `worker-src 'none'` | Both calls blocked. Two `worker-src` violations. |

`npm run lint` passes. To watch a rule fire, add `new Worker('/tasks.worker.js')`
to `app.js`, or change `workerScript` in `config.js` to a different path.
