# Widget: innerHTML under Trusted Types

The customer's shop sends `require-trusted-types-for 'script'`. The Orbit ID
widget renders a sign-in card into the shop.

- `/demo/widget/escaped`: the widget escapes each value, but it still assigns a
  string to `innerHTML`. The widget breaks.
- `/demo/widget/policy`: the widget passes its markup through a Trusted Types
  policy named `orbit-widget`. The widget works.
- `/demo/widget/policy-not-allowed`: the CSP also sends
  `trusted-types shop-policy`. The list does not name `orbit-widget`, so the
  widget breaks.

`widget.js` is the original widget, and no page loads it. `npm run lint` flags
its `innerHTML` lines and the escaped copy. `eslint-plugin-no-unsanitized`
accepts escaped values, so only the `innerHTML` rule flags `widget-escaped.js`.
