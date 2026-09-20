# When Working JavaScript Breaks

Demo code for a conference talk. Each demo shows working JavaScript that breaks
under a browser security policy.

Use Node.js 22 or later. Run `npm ci` once in this folder.

Start every demo at once, then open the hub page at
http://127.0.0.1:4173:

```sh
npm start
```

Press Ctrl+C to stop them. From another terminal, run `npm run stop`.

Each folder in `demos/` is one demo, with its own server, lint rules, Semgrep
rules, tests, and README. Run one demo on its own like this:

```sh
cd demos/trusted-types
npm start
npm run lint
npm run scan
npm test
```

Each demo has its own port, so the demos never collide. A demo with a second
origin, such as Orbit ID, the fake identity provider, uses its own port plus 100. `demos/common/demos.js` holds the list, and every server, script, and
page reads it.

The demos:

- `trusted-types/` on 4201: Trusted Types blocks strings in `innerHTML`
- `iframe-sandbox/` on 4202: a sandboxed frame needs a token to redirect the
  page
- `script-src-eval/` on 4203: `script-src` blocks `eval`, also in a webpack
  build
- `worker-src-blob/` on 4204: `worker-src` blocks a Worker from a Blob URL
- `coop-popup/` on 4205: COOP cuts the window relationship of a popup login
- `coop-broadcast-channel/` on 4206: a popup login that COOP does not break
- `connect-src/` on 4207: `connect-src` blocks an API host
- `connect-src-api-client/` on 4208: lint keeps every API call inside the
  `connect-src` contract
- `reporting-api/` on 4209: report-only policies and browser reports
- `api-preconditions/` on 4210: what eleven different APIs need before they run

The reporting demo needs HTTPS, because Chromium sends no reports over plain
HTTP. `npm start` in `demos/reporting-api` runs that launcher. The hub page
links to the plain HTTP pages of the same demo.

Each demo folder holds every file that its pages need, its own copy included.
`demos/common/` holds only the shared helper code: the demo list, the route
table, the hub page, the Playwright configuration, the test helpers, the
Semgrep wrapper, and the start and stop scripts.

From this folder, `npm test`, `npm run lint`, and `npm run scan` run every demo.
Lint and scan fail on purpose, because they find the lines that break. The
tests use ports 4175 and 4176, so they run while the demos are up.

Semgrep is a Python tool. Install it with `pip install semgrep`.
