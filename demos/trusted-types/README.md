# Trusted Types: innerHTML

`require-trusted-types-for 'script'` refuses every string in a markup sink,
such as `innerHTML`. A constant string and an escaped string are refused too.
Only a Trusted Types policy makes a value that a sink accepts, and the
`trusted-types` list names the policies that the page allows.

One page, `app.html`, and one script, `app.js`, serve every route. `app.js`
holds the Orbit ID sign-in widget in four styles, and the last part of the URL
picks one. The shop name on the page holds a tag, so you can see what each
style does with a value.

| Route       | Style                               | Header                       | What happens                        |
| ----------- | ----------------------------------- | ---------------------------- | ----------------------------------- |
| `no-header` | `innerHTML = ` plain string         | none                         | Renders, and the name becomes a tag |
| `string`    | `innerHTML = ` plain string         | `trusted-types 'none'`       | `TypeError`, the widget stays empty |
| `escape`    | `innerHTML = escapeHtml` …          | `trusted-types 'none'`       | `TypeError`, the widget stays empty |
| `policy`    | `innerHTML = policyHtml` …          | `trusted-types orbit-widget` | Renders, and the name stays text    |
| `dom`       | `createElement()` and `textContent` | `trusted-types 'none'`       | Renders, and the name stays text    |

The first two rows are the cold open: the same code, one header apart. The
third row is the point of the demo. `escapeHtml` stops injection, and the
browser refuses it anyway, because the result is still a string.

## The three lints

Each lint allows one way to write markup and flags the rest. `app.js` holds
all four styles on purpose, so each lint fails here with a known list. Pick
one lint for a real codebase, not three.

| Command                      | Configuration                    | What it allows                          |
| ---------------------------- | -------------------------------- | --------------------------------------- |
| `npm run lint:forbid`        | `eslint.forbid.config.js`        | Nothing. Build the nodes with DOM APIs. |
| `npm run lint:escape`        | `eslint.escape.config.js`        | ``innerHTML = escapeHtml`…` ``          |
| `npm run lint:trusted-types` | `eslint.trusted-types.config.js` | ``innerHTML = policyHtml`…` ``          |

`eslint.sinks.js` holds the one list of markup sinks that the three
configurations share.

`lint:forbid` is the strictest. The app then needs no policy, and the page can
send `trusted-types 'none'`.

`lint:escape` matches an app without the header. It is not enough with the
header, and the `escape` route shows why.

`lint:trusted-types` matches an app that keeps its templates. The policy name
in `policyHtml()` and the name in the `trusted-types` header must agree, so
the name belongs in the contract you give your customers.

Run the three commands one at a time, because the first failure stops
`npm run lint`.
