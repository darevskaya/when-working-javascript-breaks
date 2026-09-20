import { serve, listener, isMain, ports } from '../common/serve.js';

// The customer's shop sends Trusted Types. The pages differ in the widget
// script that they load, and one page also lists the allowed policy names.
export function createServer({ tls } = {}) {
  const trustedTypes = "require-trusted-types-for 'script'";
  return listener(
    tls,
    serve(
      {
        '/': 'index.html',
        // The escaped widget still assigns strings to innerHTML, so it breaks.
        '/demo/trusted-types/escaped-string': {
          file: 'escaped-page.html',
          'Content-Security-Policy': trustedTypes,
        },
        // This widget passes its markup through a Trusted Types policy.
        '/demo/trusted-types/named-policy': {
          file: 'policy-page.html',
          'Content-Security-Policy': trustedTypes,
        },
        // The customer lists the allowed policy names, without orbit-widget.
        '/demo/trusted-types/policy-not-allowed': {
          file: 'policy-page.html',
          'Content-Security-Policy': `${trustedTypes}; trusted-types shop-policy`,
        },
        '/styles.css': 'styles.css',
        '/orbit.css': 'orbit.css',
        '/innerhtml-escaped.js': 'innerhtml-escaped.js',
        '/innerhtml-policy.js': 'innerhtml-policy.js',
        '/trusted-html.js': 'trusted-html/index.js',
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
