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
