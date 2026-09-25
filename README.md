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

Each folder in `demos/` is one demo, with its own server, lint rules, tests,
and README. Run one demo on its own like this:

```sh
cd demos/restrict-inner-html
npm start
npm run lint
npm test
```

Each demo has its own port, so the demos never collide. A demo with a second
origin, such as Orbit ID, the fake identity provider, uses its own port plus 100. `demos/common/demos.js` holds the list, and every server, script, and
page reads it.

The demos:

- `restrict-inner-html/` on 4201: Trusted Types blocks strings in `innerHTML`
- `script-src-eval/` on 4203: `script-src` blocks `eval`, also in a webpack
  build
- `playwright-policies/` on 4204: one Playwright suite under two sets of
  security headers, the reports the failure carries, and a page that
  `frame-ancestors` keeps out of an iframe
- `coop-popup/` on 4205: COOP cuts the window relationship of a popup login
- `coop-broadcast-channel/` on 4206: a popup login that COOP does not break
- `restrict-architecture-eslint/` on 4208: two lint rules keep every API call
  inside the `connect-src` contract
- `reporting-api/` on 4209: report-only policies and browser reports
- `worker-src-eslint/` on 4210: three lint rules keep every worker inside the
  `worker-src` contract

The reporting demo needs HTTPS, because Chromium sends no reports over plain
HTTP. `npm start` in `demos/reporting-api` runs that launcher. The hub page
links to the plain HTTP pages of the same demo.

Each demo folder holds every file that its pages need, its own copy included.
`demos/common/` holds only the shared helper code: the demo list, the route
table, the hub page, the Playwright configuration, the test helpers, and the
start and stop scripts.

From this folder, `npm test` and `npm run lint` run every demo. Lint fails on
purpose, because it finds the lines that break. The tests use ports 4175 and
4176, so they run while the demos are up.
