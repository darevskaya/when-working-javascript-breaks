# Restrict the architecture with ESLint

Two lint rules hold one contract up.

1. `api-client.js` is the only file that calls `fetch`.
2. `config.js` is the only file that names an origin, and it names only the
   allowed origin that `eslint.config.js` lists.

Together they mean that every network call starts from an origin in
`config.js`. `server.js` builds the `connect-src` header from the same
`config.js`, so the policy the browser enforces and the policy the code obeys
cannot drift apart.

## The files

| File            | Rule it lives under                               |
| --------------- | ------------------------------------------------- |
| `config.js`     | May name an allowed origin. May not call `fetch`. |
| `api-client.js` | May call `fetch`. May not name an origin.         |
| `app.js`        | May do neither. It calls the API client.          |

`npm run lint` passes. This demo is the one that holds, so `app.js` has no
finding. To watch a rule fire, add one of these lines to `app.js`:

```js
fetch('/profile'); // Call the API through api-client.js.
const host = 'https://api.example.com'; // Put each API origin in config.js.
```

To watch the allowlist fire, add this line to the `config` object in
`config.js`:

```js
newsApiOrigin: 'http://forbidden.com', // Name only an allowed origin: http://127.0.0.1:4308.
```

## The two routes

`npm start` serves one page on two routes. The page and the script are the
same. Only the header differs.

- `/demo/restrict-architecture-eslint/from-config`: `connect-src 'self'` plus
  the origins in `config.js`. Both calls load.
- `/demo/restrict-architecture-eslint/narrow-policy`: `connect-src 'self'`
  alone, the policy of a customer who never listed the API origin. Both calls
  fail, and the browser reports two `connect-src` violations.

The second route is the reason the contract matters. Your code is correct and
your lint passes, and a customer header still stops the call. The API origin
belongs in the embedding contract you give that customer.

The API server listens on the port inside `config.apiOrigin`, port 4308. Stop
a demo that runs by hand before you run `npm test`, or the port is taken.
