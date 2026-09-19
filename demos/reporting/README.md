# Browser reports

CSP, COOP, and COEP examples in enforce and report-only modes. The browser
sends each violation report to `/reports`, and the terminal prints it.

The browser delivers reports only over HTTPS. `npm start` opens a Chromium
window on an HTTPS server with a throwaway certificate. The reports also go to
`logs/browser-reports.jsonl`.

This demo has no lint rule. The browser reports the violations at run time.
