import { serve, listener, common, isMain, ports } from '../common/serve.js';

// The pages differ in one header. The module page also starts the worker in
// another way: from a module file instead of a Blob URL.
export function createServer({ tls } = {}) {
  return listener(
    tls,
    serve(
      {
        '/': 'index.html',
        '/demo/fractal/permissive': {
          file: 'fractal.html',
          'Content-Security-Policy': "worker-src 'self' blob:",
        },
        '/demo/fractal/restricted': {
          file: 'fractal.html',
          'Content-Security-Policy': "worker-src 'self'",
        },
        '/demo/fractal/module': {
          file: 'fractal.html',
          'Content-Security-Policy': "worker-src 'self'",
        },
        '/styles.css': common('styles.css'),
        '/fractal.css': 'fractal.css',
        '/fractal.js': 'fractal.js',
        '/fractal-worker.js': 'fractal-worker.js',
        '/worker-factory.js': 'worker-factory.js',
        '/fractal-module-worker.js': 'fractal-module-worker.js',
      },
      { root: import.meta.dirname },
    ),
  );
}

if (isMain(import.meta)) {
  createServer().listen(ports.app, '127.0.0.1', () =>
    console.log(`Fractal: http://127.0.0.1:${ports.app}`),
  );
}
