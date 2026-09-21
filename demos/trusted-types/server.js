import { serve, listener, isMain, demoPorts } from '../common/serve.js';

const ports = demoPorts(import.meta);

const requireTrustedTypes = "require-trusted-types-for 'script'";
// No policy name, so the page allows no policy at all.
const noPolicy = `${requireTrustedTypes}; trusted-types 'none'`;
// One policy name. policyHtml() in app.js creates that policy.
const onePolicy = `${requireTrustedTypes}; trusted-types orbit-widget`;

const page = (csp) =>
  csp ? { file: 'app.html', 'Content-Security-Policy': csp } : 'app.html';

// One page, app.html, and one script, app.js, on every route. The route picks
// the widget style, and the row below picks the header.
export function createServer({ tls } = {}) {
  return listener(
    tls,
    serve(
      {
        '/': 'index.html',
        '/demo/trusted-types/no-header': page(),
        '/demo/trusted-types/string': page(noPolicy),
        '/demo/trusted-types/escape': page(noPolicy),
        '/demo/trusted-types/policy': page(onePolicy),
        '/demo/trusted-types/dom': page(noPolicy),
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
    console.log(`trusted-types: http://127.0.0.1:${ports.app}`),
  );
}
