import { serve, listener, common, isMain, ports } from '../common/serve.js';

// The first two pages differ in one header. The HTML and the JavaScript are
// the same, and the page renders its templates with eval. The bundle page
// loads the webpack build of the same script. Its source has no eval, but the
// build adds it. Run npm run build first.
export function createServer({ tls } = {}) {
  return listener(
    tls,
    serve(
      {
        '/': 'index.html',
        '/demo/summary/permissive': {
          file: 'summary.html',
          'Content-Security-Policy': "script-src 'self' 'unsafe-eval'",
        },
        '/demo/summary/restricted': {
          file: 'summary.html',
          'Content-Security-Policy': "script-src 'self'",
        },
        '/demo/summary/bundle': {
          file: 'summary-bundle.html',
          'Content-Security-Policy': "script-src 'self'",
        },
        '/styles.css': common('styles.css'),
        '/summary.css': 'summary.css',
        '/summary.js': 'summary.js',
        '/template.js': 'template.js',
        '/bundle/summary.js': 'dist/summary.js',
        '/bundle/summary.js.map': 'dist/summary.js.map',
      },
      { root: import.meta.dirname },
    ),
  );
}

if (isMain(import.meta)) {
  createServer().listen(ports.app, '127.0.0.1', () =>
    console.log(`Order summary: http://127.0.0.1:${ports.app}`),
  );
}
