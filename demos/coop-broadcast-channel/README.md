# COOP: popup login with BroadcastChannel

The same three COOP modes as the `coop-popup` demo. This login needs no window
reference, and the browser holds no token.

1. The app opens `/bff/login` with `noopener`. The BFF in `bff.js` sends the
   popup to Orbit ID with a PKCE challenge.
2. Orbit ID sends the popup back to `/bff/callback` with a one-time code.
3. The BFF exchanges the code for a token on the server. It sets an `HttpOnly`
   session cookie.
4. The callback page posts "done" on a `BroadcastChannel`. The app then asks
   `/bff/user` who signed in.

The login works in all three modes. `npm run lint` uses the `coop-popup` demo's rules,
and it finds nothing.

Source: [RFC 10017](https://www.rfc-editor.org/rfc/rfc10017), section 6.1.
