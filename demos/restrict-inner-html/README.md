# Trusted Types: innerHTML

`require-trusted-types-for 'script'` refuses every string in a markup sink,
such as `innerHTML`. A constant string is refused too. Only a Trusted Types
policy makes a value that a sink accepts, and the `trusted-types` list names
the policies that the page allows.

One page, `app.html`, serves every route. The Orbit ID sign-in widget has
three styles, one file each, and the last part of the URL picks one. `app.js`
loads the style and shows the result. The shop name on the page holds a tag,
so you can see what each style does with a value.

| Route       | File                    | Style                               | Header                    | What happens                        |
| ----------- | ----------------------- | ----------------------------------- | ------------------------- | ----------------------------------- |
| `no-header` | `render-with-string.js` | `innerHTML = ` plain string         | none                      | Renders, and the name becomes a tag |
| `string`    | `render-with-string.js` | `innerHTML = ` plain string         | `trusted-types 'none'`    | `TypeError`, the widget stays empty |
| `policy`    | `render-with-policy.js` | `innerHTML = policyHtml` …          | `trusted-types my-widget` | Renders, and the name stays text    |
| `dom`       | `render-with-dom.js`    | `createElement()` and `textContent` | `trusted-types 'none'`    | Renders, and the name stays text    |

The first two rows are the cold open: the same code, one header apart.
`policyHtml` escapes each value and passes the result through the `my-widget`
policy, so the sink accepts it.

## The two lints

Each lint checks only the three `render-with-*.js` files. It allows one way to
write markup and flags the other files on purpose. Pick one lint for a real
codebase, not two.

| Command                    | Configuration                  | Passes                  | What it allows                                       |
| -------------------------- | ------------------------------ | ----------------------- | ---------------------------------------------------- |
| `npm run lint:forbid`      | `eslint.forbid.config.js`      | `render-with-dom.js`    | Nothing. Use createElement, textContent, and append. |
| `npm run lint:escape-html` | `eslint.escape-html.config.js` | `render-with-policy.js` | ``innerHTML = policyHtml`…` ``                       |

`lint:forbid` is the strictest. The app then needs no policy, and the page can
send `trusted-types 'none'`.

`lint:escape-html` matches an app that keeps its templates. The policy name
in `policyHtml()` and the name in the `trusted-types` header must agree, so
the name belongs in the contract you give your customers.

Run the two commands one at a time, because the first failure stops
`npm run lint`.
