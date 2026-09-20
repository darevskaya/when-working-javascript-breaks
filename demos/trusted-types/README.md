# Trusted Types: innerHTML

The customer's shop sends `require-trusted-types-for 'script'`. The Orbit ID
widget renders a sign-in card into the shop.

- `/demo/trusted-types/escaped-string`: the widget escapes each value, but it
  still assigns a string to `innerHTML`. The widget breaks.
- `/demo/trusted-types/named-policy`: the widget writes its markup through
  `setHTML()` from the `trusted-html` package in `trusted-html/`. The package
  owns a Trusted Types policy named `orbit-widget`. The widget works.
- `/demo/trusted-types/policy-not-allowed`: the CSP also sends
  `trusted-types shop-policy`. The list does not name `orbit-widget`, so the
  widget breaks.

`innerhtml-string.js` is the original widget, and no page loads it.

The lint rule bans every markup sink: `innerHTML`, `outerHTML`,
`insertAdjacentHTML()`, and `document.write()`. It has no exception for a
constant or an escaped string, because Trusted Types blocks both. Only the `setHTML` function in the `trusted-html` package can write markup,
because it uses the policy. Code imports it by the package name, and lint
rejects an import by path.

`eslint.config.js` ends with a stricter block in a comment. It blocks every
markup sink in every file, the package included, and it also covers
`setHTMLUnsafe()`, `createContextualFragment()`, `parseFromString()`, and
`srcdoc`. Remove the `//` to use it. The widget then needs DOM APIs and
`textContent`, and the app needs no Trusted Types policy. `npm run lint`
flags the original widget and the escaped copy.
