import { serve, listener, isMain, demoPorts } from '../common/serve.js';

const ports = demoPorts(import.meta);

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
        '/demo/script-src-eval/unsafe-eval-allowed': {
          file: 'templates.html',
          'Content-Security-Policy': "script-src 'self' 'unsafe-eval'",
        },
        '/demo/script-src-eval/eval-blocked': {
          file: 'templates.html',
          'Content-Security-Policy': "script-src 'self'",
        },
        '/demo/script-src-eval/eval-source-map-bundle': {
          file: 'templates-bundle.html',
          'Content-Security-Policy': "script-src 'self'",
        },
        '/styles.css': 'styles.css',
        '/templates.css': 'templates.css',
        '/templates-page.js': 'templates-page.js',
        '/eval-renderer.js': 'eval-renderer.js',
        '/bundle/templates-page.js': 'dist/templates-page.js',
        '/bundle/templates-page.js.map': 'dist/templates-page.js.map',
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
