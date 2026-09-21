# script-src: eval

`renderer.js` fills the `{{ … }}` templates on the page with `eval`. The
templates and the data are the page's own, so the code looks safe.

One page, `app.html`, serves all three routes. Its script URL is relative, so
the route decides which script the browser loads.

- `/demo/script-src-eval/unsafe-eval-allowed`: `script-src 'self'
'unsafe-eval'`. The values render.
- `/demo/script-src-eval/eval-blocked`: `script-src 'self'`. The browser blocks
  `eval`, and the raw `{{ … }}` text stays on the page.
- `/demo/script-src-eval/bundle/eval-source-map`: `script-src 'self'`, with the
  webpack bundle. webpack swaps `clean-renderer.js` in for `renderer.js`, so
  the bundled source has no `eval`. But `devtool: 'eval-source-map'` wraps every
  module in `eval()`, so the browser blocks the bundle too.

`npm start` builds the bundle first. To show the fix, open `webpack.config.js`.
Comment out `devtool: 'eval-source-map'`, and remove the `//` before
`devtool: 'source-map'`. Then run `npm start` again, and the bundle page
renders.

## The files

| File                | What it holds                                   |
| ------------------- | ----------------------------------------------- |
| `index.html`        | The links to the three routes                   |
| `app.html`          | The order summary page, on all three routes     |
| `app.css`           | The summary styles                              |
| `app.js`            | The order data, and the loop over the templates |
| `renderer.js`       | The renderer that calls `eval`                  |
| `clean-renderer.js` | The same renderer without `eval`, build only    |

## The three lints

Each lint reads its own files and finds one line. Run them one at a time,
because the first failure stops `npm run lint`.

| Command                | Configuration              | What it finds                        |
| ---------------------- | -------------------------- | ------------------------------------ |
| `npm run lint:source`  | `eslint.source.config.js`  | The `eval` in `renderer.js`          |
| `npm run lint:build`   | `eslint.build.config.js`   | The `eval` in `dist/app.js`          |
| `npm run lint:webpack` | `eslint.webpack.config.js` | The `devtool` in `webpack.config.js` |

`npm run lint:build` builds the bundle first, because it reads `dist/app.js`.
The bundled source is clean, so every `eval` it reports comes from the devtool.
`npm run lint:webpack` finds the cause of the same problem, one step earlier.
