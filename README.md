# When Working JavaScript Breaks

One calculator dialog demonstrates two ways that JavaScript can fail under Content Security Policy (CSP).
CSP defines browser restrictions for a document.
The page loads normally, and the failure occurs when you open the calculator.

## Run

Use Node.js 22 or later.

```sh
npm ci
npm start
```

Open [the calculator demo](http://127.0.0.1:4173).
The server accepts connections from this computer only.
The dialog bundle is built before the server starts.
The demo uses local styles and system fonts.

If you change a source file, restart `npm start` and reload the browser.
If port 4173 is occupied, set `$env:PORT = '4174'` before starting in PowerShell.

## Present the demo

### Function constructor

1. Select `script-src 'self' 'unsafe-eval'`.
2. Open the calculator and calculate the total.
3. Close the dialog and select `script-src 'self'`.
4. Open the calculator again and inspect the CSP error in the browser console.

The dialog creates the calculation function when it opens.
CSP blocks `new Function` under the restricted policy, before the dialog appears.
The calculation selector offers a subtotal, a 10% discount, and 20% tax.
`new Function` compiles the selected formula string into a function.
The regular functions remain commented out in `demos/calculator/calculate.js` for a later example.
Uncomment the `calculations` object and its return statement, then rebuild to use them.
Changing the calculation selects a new function and clears the previous result.

### Webpack source maps

1. Enable the commented regular functions and return statement in `demos/calculator/calculate.js`.
2. In `webpack.config.js`, uncomment `devtool: 'eval-source-map'`.
3. Run `npm run build` and reload the page.
4. Select `script-src 'self' 'unsafe-eval'`.
5. Open the calculator to show that it works.
6. Close the dialog and select `script-src 'self'`.
7. Open the calculator again and inspect the CSP error in the browser console.
8. Comment out `devtool: 'eval-source-map'` again.
9. Rebuild, reload, and open the calculator to show the fix.

Webpack produces one bundle, a generated JavaScript file.
The default `source-map` configuration does not wrap the code in `eval()`.
The optional `eval-source-map` configuration does, so CSP blocks the bundle before it initializes.
It overrides the preceding `devtool` value when uncommented.
This is a deliberate demonstration, not Webpack's production default.

Both implementations use the same bundle.
Restore `source-map` and comment out the regular functions and their return statement before demonstrating `new Function`.
The page requests the bundle only after you select "Open calculator".
No violation occurs on the initial page load.
The browser enforces the actual CSP response headers.

Changing the policy loads a new document and resets the calculator.
Close the dialog before changing the policy.
There are no iframes or explanation panels.

## Routes

The server matches `/demo/:name/:policy` against the `demoPages` registry.
The single current demo is `calculator`.

| Route                         | Script policy                     |
| ----------------------------- | --------------------------------- |
| `/demo/calculator/permissive` | `script-src 'self' 'unsafe-eval'` |
| `/demo/calculator/restricted` | `script-src 'self'`               |

Unknown demo names and policies return 404.
The root URL redirects to the permissive policy.
Links to the earlier `/demo/eval/` and `/demo/function/` pages redirect to the calculator.

Both policy routes serve identical HTML and scripts.
Only the CSP response header differs.
The other policy restrictions stay the same.
Refresh and browser Back/Forward restore the controls from the URL.

## Project files

| File                            | Purpose                                                         |
| ------------------------------- | --------------------------------------------------------------- |
| `server.js`                     | Serves the page, assets, and CSP headers                        |
| `public/calculator.html`        | Contains the page controls and dialog markup                    |
| `public/calculator.js`          | Navigates between selections and loads the dialog after a click |
| `demos/calculator/dialog.js`    | Opens the dialog and handles calculations                       |
| `demos/calculator/calculate.js` | Compiles the selected formula into a function                   |
| `webpack.config.js`             | Builds the dialog bundle                                        |
| `public/styles.css`             | Defines the shared visual styles                                |
| `public/calculator.css`         | Defines the calculator layout                                   |

## Tests

Run `npm test` to build the default bundle and test the HTTP behavior and generated output.
To run the browser tests:

```sh
npx playwright install chromium
npm run test:browser
```

Install Chromium before going offline.
The tests start a separate server on port 4175.
They cover both policies and all three calculations with the default build.
They verify that no violation occurs on page load and that `new Function` fails only when opening the dialog.
They also cover calculations, validation, closing, retry, refresh, browser history, and mobile layout.

Run `npm run format` to format the source.
Run `npm run format:check` to check formatting.

## References

[Webpack devtool documentation](https://webpack.js.org/configuration/devtool/) describes source-map configurations.
[MDN script-src documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/script-src) describes restrictions on string evaluation.
