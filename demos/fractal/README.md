# Fractal: Blob worker

The page draws a Mandelbrot set in a Worker. `workerFactory()` in
`worker-factory.js` is the only code that starts a Worker.

- `/demo/fractal/permissive`: `worker-src 'self' blob:`. The Blob worker
  renders.
- `/demo/fractal/restricted`: `worker-src 'self'`. The browser blocks the Blob
  URL, and the canvas stays empty.
- `/demo/fractal/module`: the same policy. The worker starts from a module file
  on the page origin, and the fractal renders.

`npm run lint` flags the Blob worker in `worker-factory.js`. The Semgrep rule
follows the Blob URL through variables.
