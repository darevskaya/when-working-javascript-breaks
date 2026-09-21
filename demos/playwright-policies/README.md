# Playwright under security policies

This demo is about the test run, not about the feature. It shows how to run
one Playwright suite under two sets of security headers, watch the strict run
fail, and read the violation reports that the failure carries.

The page has two small features, one per kind of header.

- A Worker that carries its code in a Blob URL. The page needs `blob:` in
  `worker-src`. A policy with no worker directive falls back to `child-src`,
  then to `script-src`, so a plain `script-src 'self'` blocks it.
- Geolocation. `Permissions-Policy: geolocation=()` turns it off for the page.

`app.js` also runs a `ReportingObserver` and prints every report it receives
on the page, so you see in the browser what the test reads in the report.

## The files

One page, `app.html`, one script, `app.js`, and one stylesheet, `app.css`, on
both routes. Only the headers differ.

- `/demo/playwright-policies/allowed`: `script-src 'self'; worker-src 'self'
blob:`. The worker replies, and geolocation is on.
- `/demo/playwright-policies/blocked`: `script-src 'self'` and
  `Permissions-Policy: geolocation=()`. Both features stop, and two reports
  appear on the page.

## The three Playwright projects

`playwright.config.js` holds three projects.

| Command                   | Project      | Policy                                       | Result           |
| ------------------------- | ------------ | -------------------------------------------- | ---------------- |
| `npm test`                | `demo`       | the headers the server sends                 | Passes           |
| `npm run test:permissive` | `permissive` | `script-src 'self'; worker-src 'self' blob:` | Passes           |
| `npm run test:strict`     | `strict`     | `script-src 'self'`                          | Fails on purpose |

`test/policy-projects.spec.js` runs in both policy projects. `page.route()`
fetches the response, puts the `csp` and the `permissionsPolicy` of the
project on it, and gives it to the browser. The page, the script, the server
and the test stay the same, so the headers are the only difference between the
two runs.

The test reads the reports through a `ReportingObserver`. The observer takes
no `types` option, so it collects every kind the browser makes, not only
`csp-violation`. This is the report the browser would send to a reporting
endpoint, so the test reads what production monitoring reads.

Each run attaches the list as `reports.json` and adds one annotation per
report. The strict run fails with a screenshot, a trace, and two annotations:

```
report  csp-violation: worker-src
report  permissions-policy-violation: geolocation
```

Run `npm run test:report` to open the report of the last run.

## Lint

`npm run lint` flags the `new Worker(url)` line in `app.js`, because the URL is
not a script path. The rule names the line before the browser does. It fails on
purpose, because the demo needs the Blob worker.
