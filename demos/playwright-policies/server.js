import { serve, listener, isMain, demoPorts } from '../common/serve.js';

const ports = demoPorts(import.meta);

// One page and one script on both routes. Only the headers differ, which is
// the point of the demo: the Playwright projects change the same two headers
// from the test, without a second page and without a second server.
export function createServer({ tls } = {}) {
  return listener(
    tls,
    serve(
      {
        '/': 'index.html',
        '/demo/playwright-policies/allowed': {
          file: 'app.html',
          'Content-Security-Policy':
            "script-src 'self'; worker-src 'self' blob:",
        },
        '/demo/playwright-policies/blocked': {
          file: 'app.html',
          // No worker directive. worker-src falls back to child-src, then to
          // script-src, so script-src 'self' alone blocks the Blob worker.
          'Content-Security-Policy': "script-src 'self'",
          'Permissions-Policy': 'geolocation=()',
        },
        '/styles.css': 'styles.css',
        '/app.css': 'app.css',
        '/app.js': 'app.js',
      },
      { root: import.meta.dirname },
    ),
  );
}

if (isMain(import.meta)) {
  createServer().listen(ports.app, '127.0.0.1', () =>
    console.log(`playwright-policies: http://127.0.0.1:${ports.app}`),
  );
}
