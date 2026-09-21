# Playwright under security policies

This demo is about the test run, not about the feature. It shows how to run
one Playwright suite under two sets of security headers, watch the strict run
fail, and read the violation reports that the failure carries.

The page has one small feature: a Worker that carries its code in a Blob
URL. The page needs `blob:` in `worker-src`. A policy with no worker directive
falls back to `child-src`, then to `script-src`, so a plain
`script-src 'self'` blocks it.

`app.js` shows one status line for the worker. It does not observe reports.
The test adds the `ReportingObserver`, so the page code stays the same code
that ships.

## The files

One page, `app.html`, one script, `app.js`, and one stylesheet, `app.css`, on
both routes. Only the headers differ.

- `/demo/playwright-policies/allowed`: `script-src 'self'; worker-src 'self'
blob:`. The worker replies.
- `/demo/playwright-policies/blocked`: `script-src 'self'; frame-ancestors
'none'`. The browser refuses the worker. `frame-ancestors 'none'` names who
  may embed the page: nobody. The page opens on its own, and the browser
  refuses it inside an iframe, on this origin too.

## The two Playwright projects

`playwright.config.js` holds two projects. `npm test` runs the permissive
project.

| Command                   | Project      | Policy                                       | Result           |
| ------------------------- | ------------ | -------------------------------------------- | ---------------- |
| `npm run test:permissive` | `permissive` | `script-src 'self'; worker-src 'self' blob:` | Passes           |
| `npm run test:strict`     | `strict`     | `script-src 'self'; frame-ancestors 'none'`  | Fails on purpose |

`test/policy-projects.spec.js` is the only spec. It runs in both projects. One
test starts the worker, and one test embeds the page in an iframe.

`page.route()` fetches the response, puts the `csp` of the project on it, and gives it to the
browser. The page, the script, the server and the test stay the same, so the headers are the only
difference between the two runs.

`test/policy-projects.spec.js` adds a `ReportingObserver` to the page with
`page.addInitScript()`, before `app.js` runs. The observer takes no `types`
option, so it collects every kind of report the browser makes. This is the
report that the browser sends to a reporting endpoint, so the test reads what production monitoring reads.

Each run attaches the list as `reports.json` and adds one annotation per
report. In the strict run, the worker test fails with a screenshot, a trace,
and this annotation:

```
report  csp-violation: worker-src blocked blob
```

The iframe test is an expected failure in the strict run. `test.fail()` marks
it, so the run counts it as passed when the browser refuses the frame. The
report still carries its annotation:

```
report  csp-violation: frame-ancestors blocked http://127.0.0.1:4175/
```

Run `npm run test:report` to open the report of the last run.

## Lint

`npm run lint` flags the `new Worker(url)` line in `app.js`, because the URL is
not a script path. The rule names the line before the browser does. It fails on
purpose, because the demo needs the Blob worker.
