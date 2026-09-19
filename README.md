# When Working JavaScript Breaks

Demo code for a conference talk. Each demo shows working JavaScript that breaks
under a browser security policy.

Use Node.js 22 or later. Run `npm ci` once in this folder.

Each folder in `demos/` is one demo, with its own server, lint rules, Semgrep
rules, tests, and README. Run one demo at a time:

```sh
cd demos/trusted-types
npm start
npm run lint
npm run scan
npm test
```

`npm start` serves the demo on http://127.0.0.1:4173. Some demos also start
Orbit ID, a fake identity provider, on port 4174.

The demos:

- `trusted-types/`: Trusted Types blocks strings in `innerHTML`
- `iframe-sandbox/`: a sandboxed frame needs a token to redirect the page
- `script-src-eval/`: `script-src` blocks `eval`, also in a webpack build
- `worker-src-blob/`: `worker-src` blocks a Worker from a Blob URL
- `coop-popup/`: COOP cuts the window relationship of a popup login
- `coop-broadcast-channel/`: a popup login that COOP does not break
- `connect-src/`: `connect-src` blocks an API host
- `reporting-api/`: report-only policies and browser reports

`demos/common/` holds the files that several demos share.

From this folder, `npm test`, `npm run lint`, and `npm run scan` run every demo.
Lint and scan fail on purpose, because they find the lines that break. To stop a
demo server from another terminal, run `npm run stop`.

Semgrep is a Python tool. Install it with `pip install semgrep`.
