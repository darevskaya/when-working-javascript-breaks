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
Both bundles are built before the server starts.
The demo uses local styles and system fonts.

If you change a source file, restart `npm start` and reload the browser.
If port 4173 is occupied, set `$env:PORT = '4174'` before starting in PowerShell.

## Present the demo

1. Select "Webpack build", `script-src 'self' 'unsafe-eval'`, and `eval-source-map`.
2. Select "Open calculator".
3. Select "Calculate total" to see `$75.00`.
4. Close the dialog.
5. Select `script-src 'self'`.
6. Open the calculator again and inspect the browser console.
7. Select `source-map` under "Webpack source maps".
8. Open the calculator to show that it works under the same policy.
9. Close the dialog and select "Function constructor".
10. Select `new Function` under "Calculation function" and open the calculator to demonstrate the second failure.
11. Select "Regular function" and open the calculator again.

The example selector changes which code setting appears.
"Content Security Policy" controls whether CSP allows JavaScript created from strings.
Both browser policies still enforce the other CSP restrictions.

Changing any control navigates to a new document and resets the calculator.
Close the dialog before changing the controls.
The dialog uses the full browser window.
There are no iframes or explanation panels.

## What each version does

| Failure source | Version  | Bundle            | Formula         |
| -------------- | -------- | ----------------- | --------------- |
| Webpack eval   | Original | `eval-source-map` | Normal function |
| Webpack eval   | Fixed    | `source-map`      | Normal function |
| new Function   | Original | `source-map`      | `new Function`  |
| new Function   | Fixed    | `source-map`      | Normal function |

The page requests the dialog bundle, a generated JavaScript file, only after you select "Open calculator".
The same feature source produces both bundles.
No feature bundle loads on the initial page load.

In the Webpack example, the original bundle wraps code in `eval()`.
The restricted policy blocks execution before the bundle can initialize.
This uses `mode: 'production'` with a deliberately unsuitable `devtool: 'eval-source-map'` setting.
It is not Webpack's production default.

In the `new Function` example, the bundle loads without `eval()`.
Opening the dialog then creates a function from the formula string `return price * quantity;`.
The restricted policy blocks that operation before the dialog appears.
Calculating the total uses the function that was already created when the dialog opened.

Both fixed versions use a normal function and an eval-free bundle.
The application never chooses to fail based on the policy.
The browser enforces the actual response headers.

## Routes

The server matches `/demo/:name/:policy` against the `demoPages` registry.
The single current demo is `calculator`.

| Route                         | Script policy                     |
| ----------------------------- | --------------------------------- |
| `/demo/calculator/permissive` | `script-src 'self' 'unsafe-eval'` |
| `/demo/calculator/restricted` | `script-src 'self'`               |

Use `?example=webpack&version=original` to select the initial example.
The other values are `example=function` and `version=fixed`.
Missing or unrecognized selections default to `webpack` and `original`.
Unknown demo names and policies return 404.
The root URL redirects to the permissive Webpack example.
Links to the earlier `/demo/eval/` and `/demo/function/` pages redirect to matching calculator selections.

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
| `demos/calculator/calculate.js` | Creates a normal function or a function from a string           |
| `webpack.config.js`             | Builds the two bundle variants                                  |
| `public/styles.css`             | Defines the shared visual styles                                |
| `public/calculator.css`         | Defines the calculator layout                                   |

## Tests

Run `npm test` to build the bundles and test the HTTP behavior and generated output.
To run the browser tests:

```sh
npx playwright install chromium
npm run test:browser
```

Install Chromium before going offline.
The tests start a separate server on port 4175.
They cover all eight policy, example, and version combinations.
They verify that no violation occurs on page load and that the original versions fail only when opening the dialog.
They also cover calculations, validation, closing, retry, refresh, browser history, and mobile layout.

Run `npm run format` to format the source.
Run `npm run format:check` to check formatting.

## References

[Webpack devtool documentation](https://webpack.js.org/configuration/devtool/) describes source-map configurations.
[MDN script-src documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/script-src) describes restrictions on string evaluation.
