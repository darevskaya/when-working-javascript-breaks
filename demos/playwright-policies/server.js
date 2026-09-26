import { serve, listener, isMain, demoPorts } from '../common/serve.js';

const ports = demoPorts(import.meta);

export function createServer({ tls } = {}) {
  return listener(
    tls,
    serve(
      {
        '/': 'index.html',
        // No policy here: each Playwright project adds its own.
        '/demo/playwright-policies/worker': 'worker.html',
        '/demo/playwright-policies/iframe': 'iframe.html',
        '/demo/playwright-policies/framed': 'framed.html',
        '/styles.css': 'styles.css',
        '/checks.css': 'checks.css',
        '/iframe.js': 'iframe.js',
        '/worker.js': 'worker.js',
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
