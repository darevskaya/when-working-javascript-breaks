import { fileURLToPath } from 'node:url';
import { serve, listener, isMain, demoPorts } from '../common/serve.js';

const ports = demoPorts(import.meta);

const requireTrustedTypes = "require-trusted-types-for 'script'";
const noPolicy = `${requireTrustedTypes}; trusted-types 'none'`;
const onePolicy = `${requireTrustedTypes}; trusted-types dompurify`;

const page = (csp) =>
  csp ? { file: 'app.html', 'Content-Security-Policy': csp } : 'app.html';

export function createServer({ tls } = {}) {
  return listener(
    tls,
    serve(
      {
        '/': 'index.html',
        '/demo/restrict-inner-html/no-header': page(),
        '/demo/restrict-inner-html/string': page(noPolicy),
        '/demo/restrict-inner-html/policy': page(onePolicy),
        '/demo/restrict-inner-html/dom': page(noPolicy),
        '/styles.css': 'styles.css',
        '/app.css': 'app.css',
        '/app.js': 'app.js',
        '/render-with-string.js': 'render-with-string.js',
        '/render-with-policy.js': 'render-with-policy.js',
        '/render-with-dom.js': 'render-with-dom.js',
        '/purify.js': {
          file: fileURLToPath(import.meta.resolve('dompurify')),
          'Content-Type': 'text/javascript; charset=utf-8',
        },
      },
      { root: import.meta.dirname },
    ),
  );
}

if (isMain(import.meta)) {
  createServer().listen(ports.app, '127.0.0.1', () =>
    console.log(`restrict-inner-html: http://127.0.0.1:${ports.app}`),
  );
}
