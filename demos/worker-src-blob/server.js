import { serve, listener, isMain, demoPorts } from '../common/serve.js';

const ports = demoPorts(import.meta);

// The pages differ in one header. The module page also starts the worker in
// another way: from a module file instead of a Blob URL.
export function createServer({ tls } = {}) {
  return listener(
    tls,
    serve(
      {
        '/': 'index.html',
        '/demo/worker-src-blob/blob-allowed': {
          file: 'worker-page.html',
          'Content-Security-Policy': "worker-src 'self' blob:",
        },
        '/demo/worker-src-blob/blob-blocked': {
          file: 'worker-page.html',
          'Content-Security-Policy': "worker-src 'self'",
        },
        '/demo/worker-src-blob/module-worker': {
          file: 'worker-page.html',
          'Content-Security-Policy': "worker-src 'self'",
        },
        '/styles.css': 'styles.css',
        '/worker-page.css': 'worker-page.css',
        '/worker-page.js': 'worker-page.js',
        '/blob-worker-source.js': 'blob-worker-source.js',
        '/worker-factory.js': 'worker-factory.js',
        '/module-worker.js': 'module-worker.js',
      },
      { root: import.meta.dirname },
    ),
  );
}

if (isMain(import.meta)) {
  createServer().listen(ports.app, '127.0.0.1', () =>
    console.log(`worker-src-blob: http://127.0.0.1:${ports.app}`),
  );
}
