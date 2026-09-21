import { serve, listener, isMain, demoPorts } from '../common/serve.js';

const ports = demoPorts(import.meta);

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
          // worker-src falls back to child-src, then script-src.
          'Content-Security-Policy':
            "script-src 'self'; frame-ancestors 'none'",
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
