# When Working JavaScript Breaks

Runnable JavaScript demos that fail under specific browser security rules.
The first demo shows a dialog that fails because Webpack introduces `eval()` into its output.
CSP (Content Security Policy) defines browser restrictions for a document.

## Run

Use Node.js 22 or later.

```powershell
cd C:\repos\when-working-javascript-breaks
npm ci
npm start
```

Open [the local lab](http://127.0.0.1:4173).
The server accepts connections from this computer only.
If you change a source file, restart `npm start` and reload the browser.
If the default port is occupied, set `$env:PORT = '4174'` before starting.

## Present the first demo

1. Start with "Permissive" headers and the `eval-source-map` build.
2. Open "Change display name".
3. Enter a name and select "Save".
4. Select "Restricted" headers.
5. Open the dialog and inspect the error in the browser console.
6. Switch the build to `source-map`.
7. Open the dialog again.
8. Switch back to `eval-source-map` to repeat the failure.
9. Select "Permissive" headers to return to the original state.

The lab shows one account page without iframes.
The dialog opens over the full browser window.

| Route                   | Script policy                     |
| ----------------------- | --------------------------------- |
| `/demo/eval/permissive` | `script-src 'self' 'unsafe-eval'` |
| `/demo/eval/restricted` | `script-src 'self'`               |

Add `?build=eval` or `?build=fixed` to either route.
Without a build parameter, the page uses the eval build.
The root URL redirects to `/demo/eval/permissive?build=eval`.
Each control navigates to a new document and preserves the other selection.
Direct links, refresh, and browser Back/Forward restore the controls from the URL.
The route selects the policy on the server. A `policy` query parameter cannot override it.

The header and build controls work independently.
Changing either control reloads the account with the selected response headers and build and resets the name.

The account page loads normally in both environments.
The page loads the feature bundle, a generated JavaScript file, only after a click.
The server sends identical account HTML and feature code to both environments.
Only the CSP response header differs.
Both environments enforce CSP. The permissive environment also allows `eval()`, which runs a string as JavaScript.

The permissive document allows `script-src 'self' 'unsafe-eval'`.
The restricted document allows `script-src 'self'`.
Both documents also use the same restrictions for styles, objects, base URLs, and frames.
The browser console shows the full policy when a violation occurs.

The browser enforces the restriction.
The application does not simulate a failure based on the selected policy.
The browser console displays the actual CSP failures and runtime errors.
Error wording can differ between browsers.

## Why the failure happens after a click

The page shell uses an external script without a Webpack build.
It requests the separate dialog bundle after the user selects the button.
Webpack builds that feature with `mode: 'production'` and `devtool: 'eval-source-map'`.
The generated file contains `eval()`, although the feature source does not.

This configuration is valid, but it is not Webpack's production default.
If the whole page uses an eval-based bundle, the failure can occur on page load instead.
This demo separates the page shell from the feature to show a delayed failure.

The corrected bundle uses the same source with `devtool: 'source-map'`.
It opens the dialog under the same strict policy.
The fix changes the build configuration rather than adding `'unsafe-eval'` to the restricted policy.
`npm start` builds both variants before the server starts.
The build control selects a prepared bundle and reloads the account page.
It does not rebuild code during the talk.

## Project files

| File                        | Purpose                                                   |
| --------------------------- | --------------------------------------------------------- |
| `server.js`                 | Serves documents and applies actual HTTP response headers |
| `public/lab.js`             | Navigates between policy routes and builds                |
| `public/account.js`         | Loads the feature after a click                           |
| `demos/eval/dialog.js`      | Contains the application feature                          |
| `webpack.config.js`         | Builds the failing and corrected variants                 |
| `test/server.test.js`       | Tests policies, identical HTML, and generated code        |
| `test/browser/demo.spec.js` | Tests the talk sequence in Chromium                       |

## Tests

Run `npm test` to build both bundles and test the HTTP behavior and generated output.
Run the browser tests before the talk:

```sh
npx playwright install chromium
npm run test:browser
```

The first command downloads Chromium. Run it before you go offline.
The browser tests build both variants and start a separate server on port 4175.
They cover the actual CSP failure, switching headers and builds, refresh, browser history, dialog controls, name validation, and retry after a failed download.
Use the presentation steps once in the browser that you use for the talk.
Names exist only in the current page and reset on reload.

Run `npm run format` to format the source with Prettier.
Run `npm run format:check` to make sure that formatting is consistent.

## References

[Webpack devtool documentation](https://webpack.js.org/configuration/devtool/) describes eval-based source maps and production choices.
[MDN script-src documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/script-src) describes restrictions on string evaluation.
