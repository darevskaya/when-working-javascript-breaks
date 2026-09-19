# Order summary: eval

`template.js` fills the `{{ … }}` templates on the page with `eval`. The
templates and the data are the page's own, so the code looks safe.

- `/demo/summary/permissive`: `script-src 'self' 'unsafe-eval'`. The values
  render.
- `/demo/summary/restricted`: `script-src 'self'`. The browser blocks `eval`,
  and the raw `{{ … }}` text stays on the page.
- `/demo/summary/bundle`: `script-src 'self'`, with the webpack bundle. The
  bundle uses `template-safe.js`, which has no `eval`. But
  `devtool: 'eval-source-map'` wraps every module in `eval()`, so the browser
  blocks the bundle too.

`npm start` builds the bundle first. To show the fix, open `webpack.config.js`.
Comment out `devtool: 'eval-source-map'`, and remove the `//` before
`devtool: 'source-map'`. Then run `npm start` again, and the bundle page
renders.

`npm run lint` flags the `eval` in `template.js` and the `eval-source-map`
line in `webpack.config.js`.
