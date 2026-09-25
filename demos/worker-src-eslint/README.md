# Restrict the worker with ESLint

Three lint rules hold one contract up.

1. `createWorker()` in `worker-client.js` is the only place that calls
   `new Worker`.
2. `config.js` is the only file that names a worker script, and it names only
   the allowed script that `eslint.config.js` reads from it.
3. No file builds a worker from a Blob URL.

Together they mean that every worker starts from a script in `config.js`.
`server.js` builds the `worker-src` header from the same `config.js`, so the
policy the browser enforces and the policy the code obeys cannot drift apart.

## The files

| File               | Rule it lives under                                           |
| ------------------ | ------------------------------------------------------------- |
| `config.js`        | Can name the allowed script. Cannot start a worker.           |
| `worker-client.js` | Can start a worker in `createWorker()`. Cannot name a script. |
| `app.js`           | Can do neither. It calls the worker client.                   |
| `tasks.worker.js`  | The worker itself. It adds the amounts the page sends.        |

`npm run lint` passes. This demo is the one that holds, so `app.js` has no
finding. To watch a rule fire, add one of these lines to `app.js`:

```js
new Worker('/tasks.worker.js'); // Start the worker through worker-client.js.
const script = '/other.worker.js'; // Put the worker script in config.js.
```

To watch the Blob rule fire, add this line to any of the three files:

```js
const url = URL.createObjectURL(new Blob([source])); // Start a Worker from a script path, not a Blob URL.
```

To watch the allowlist fire, change the script in `config.js`:

```js
workerScript: '/vendor.worker.js', // Name only an allowed worker script: /tasks.worker.js.
```

Each file group gets its own block in `eslint.config.js`. Two blocks that
match the same file replace each other, because ESLint keeps the options of
the last block that matches.

## The two routes

`npm start` serves one page on two routes. The page and the script are the
same. Only the header differs.

- `/demo/worker-src-eslint/from-config`: `worker-src` plus the one script in
  `config.js`. The worker replies to both calls.
- `/demo/worker-src-eslint/narrow-policy`: `worker-src 'none'`, the policy of
  a customer who allows no worker at all. Both calls fail, and the browser
  reports two `worker-src` violations.

The second route is the reason the contract matters. Your code is correct and
your lint passes, and a customer header still refuses the worker. The worker
script belongs in the embedding contract you give that customer.

A worker script must come from the origin of the page. A Blob URL is the usual
way around that rule, and it is the first thing a tight `worker-src` stops.
The lint rules here keep the worker on a real path, so one narrow source in
the header is enough.
