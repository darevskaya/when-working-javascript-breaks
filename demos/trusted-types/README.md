# Trusted Types: innerHTML

Both pages send `require-trusted-types-for 'script'`. The header refuses every
string in a markup sink, such as `innerHTML`. A constant string and an escaped
string are refused too. Only a Trusted Types policy can make a value that a
sink accepts, and the `trusted-types` list names the policies that the page
allows.

The demo shows the two answers to that header.

- `/demo/trusted-types/no-policy` sends `trusted-types 'none'`. The page allows
  no policy, so no string becomes markup. `dom-widget.js` builds each node with
  `createElement()` and writes each value with `textContent`.
- `/demo/trusted-types/one-policy` sends `trusted-types orbit-widget`. The
  `trusted-html` package owns the policy named `orbit-widget` and exports
  `setHTML()`, which escapes each value. `policy-widget.js` keeps its
  templates and writes them through `setHTML()`.

Each page also asks for a policy name that the page does not allow, and shows
what the browser answers. `policy-probe.js` does that.

## The lint rules

`eslint.config.js` holds one list of markup sinks and the same two options.

- `noMarkupAnywhere` bans every sink in every file. The app then needs no
  policy, and the page can send `trusted-types 'none'`.
- `onlyThroughSetHTML` bans every sink outside `trusted-html/`. That folder is
  the one place that writes markup, and the page names its policy.

The last line of `eslint.config.js` picks the option. `onlyThroughSetHTML`
matches the pages of this demo. `.semgrep.yml` repeats that option as a
Semgrep rule.

`string-widget.js` is the original widget, and no page loads it. Lint and
Semgrep flag its two `innerHTML` lines, so `npm run lint` fails on purpose.
