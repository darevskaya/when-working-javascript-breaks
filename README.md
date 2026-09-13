# When Working JavaScript Breaks

Demo code for a conference talk.

An order calculator compiles a formula string with `new Function`.
It works under `script-src 'self' 'unsafe-eval'`.
Select `script-src 'self'` on the page, open the calculator again, and the browser refuses to run the code.
The page prints the Content Security Policy error in red.

## Run

Use Node.js 22 or later.

```sh
npm ci
npm start
```

Open http://127.0.0.1:4173 and select "Open calculator".
