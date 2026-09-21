# connect-src: API client contract

`contract.js` lists the API origins that the customer's `connect-src` must
allow. The server sends that list in its policy, and the lint rules read the
same list:

1. Only `api-client.js` can call `fetch`.
2. In `api-client.js`, each URL starts from `config`:
   `fetch(new URL(path, config.apiOrigin))`.
3. Only `config.js` can name an origin.
4. `config.js` can name only the origins in `contract.js`.

The page code breaks each rule once, so `npm run lint` fails on purpose. The
page `/demo/connect-src-api-client/api-calls` shows what the browser does with
each call. The hard-coded URL in `api-client.js` works, because its host is in
the contract. Only lint finds it.

The API server always uses port 4308, because `config.js` names it.

## The stage test

The customer sends `connect-src`, not this server. `npm run stage` runs a
Playwright test that replaces the policy on the document response with
`connect-src 'self'`, the policy of a customer who never listed the API
origin. The profile call then fails, although `contract.js` allows its
origin, so the test fails on purpose.

A policy must arrive on the document response. `extraHTTPHeaders` sets
request headers and does not work.

The stage test needs port 4308 free, because `config.js` names it. Stop a
demo that runs by hand before you run it.
