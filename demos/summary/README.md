# Order summary: eval

`template.js` fills the `{{ … }}` templates on the page with `eval`. The
templates and the data are the page's own, so the code looks safe.

- `/demo/summary/permissive`: `script-src 'self' 'unsafe-eval'`. The values
  render.
- `/demo/summary/restricted`: `script-src 'self'`. The browser blocks `eval`,
  and the raw `{{ … }}` text stays on the page.

`npm run lint` flags the `eval` in `template.js`.
