# Trusted Types: innerHTML

The customer's shop sends `require-trusted-types-for 'script'`. The Orbit ID
widget renders a sign-in card into the shop.

- `/demo/trusted-types/escaped-string`: the widget escapes each value, but it still assigns a
  string to `innerHTML`. The widget breaks.
- `/demo/trusted-types/named-policy`: the widget passes its markup through a Trusted Types
  policy named `orbit-widget`. The widget works.
- `/demo/trusted-types/policy-not-allowed`: the CSP also sends
  `trusted-types shop-policy`. The list does not name `orbit-widget`, so the
  widget breaks.

`innerhtml-string.js` is the original widget, and no page loads it. `npm run lint` flags
its `innerHTML` lines and the escaped copy. `eslint-plugin-no-unsanitized`
accepts escaped values, so only the `innerHTML` rule flags `innerhtml-escaped.js`.
