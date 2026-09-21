import { serve, listener, isMain, demoPorts } from '../common/serve.js';

const ports = demoPorts(import.meta);

export function createServer({ tls } = {}) {
  return listener(
    tls,
    serve(
      {
        '/': 'index.html',
        '/demo/script-src-eval/unsafe-eval-allowed': {
          file: 'app.html',
          'Content-Security-Policy': "script-src 'self' 'unsafe-eval'",
        },
        '/demo/script-src-eval/eval-blocked': {
          file: 'app.html',
          'Content-Security-Policy': "script-src 'self'",
        },
        '/demo/script-src-eval/bundle/eval-source-map': {
          file: 'app.html',
          'Content-Security-Policy': "script-src 'self'",
        },
        '/demo/script-src-eval/app.js': 'app.js',
        '/demo/script-src-eval/renderer.js': 'renderer.js',
        '/demo/script-src-eval/bundle/app.js': 'dist/app.js',
        '/demo/script-src-eval/bundle/app.js.map': 'dist/app.js.map',
        '/styles.css': 'styles.css',
        '/app.css': 'app.css',
      },
      { root: import.meta.dirname },
    ),
  );
}

if (isMain(import.meta)) {
  createServer().listen(ports.app, '127.0.0.1', () =>
    console.log(`script-src-eval: http://127.0.0.1:${ports.app}`),
  );
}
