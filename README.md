# When Working JavaScript Breaks

Demo code for a conference talk. Each demo shows working JavaScript that breaks
under a browser security policy.

Use Node.js 22 or later. Run `npm ci` once in this folder.

Each folder in `demos/` is one demo, with its own server, lint rules, Semgrep
rules, tests, and README. Run one demo at a time:

```sh
cd demos/widget
npm start
npm run lint
npm run scan
npm test
```

`npm start` serves the demo on http://127.0.0.1:4173. Some demos also start
Orbit ID, a fake identity provider, on port 4174.

The demos:

- `widget/`: `innerHTML` under Trusted Types
- `embed/`: an iframe sandbox and a redirect login
- `summary/`: `eval` under `script-src`
- `fractal/`: a Blob worker under `worker-src`
- `coop/`: a popup login under COOP
- `broadcast/`: a popup login that COOP does not break
- `profile/`: `connect-src` in a Playwright test
- `reporting/`: report-only policies and browser reports

`demos/common/` holds the files that several demos share.

From this folder, `npm test`, `npm run lint`, and `npm run scan` run every demo.
Lint and scan fail on purpose, because they find the lines that break. To stop a
demo server from another terminal, run `npm run stop`.

Semgrep is a Python tool. Install it with `pip install semgrep`.
