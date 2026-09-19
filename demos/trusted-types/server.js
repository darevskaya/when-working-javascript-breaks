import { serve, listener, common, isMain, ports } from '../common/serve.js';

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
        '/demo/widget/escaped': {
          file: 'shop-escaped.html',
          'Content-Security-Policy': trustedTypes,
        },
        // This widget passes its markup through a Trusted Types policy.
        '/demo/widget/policy': {
          file: 'shop-policy.html',
          'Content-Security-Policy': trustedTypes,
        },
        // The customer lists the allowed policy names, without orbit-widget.
        '/demo/widget/policy-not-allowed': {
          file: 'shop-policy.html',
          'Content-Security-Policy': `${trustedTypes}; trusted-types shop-policy`,
        },
        '/styles.css': common('styles.css'),
        '/shop.css': common('shop.css'),
        '/orbit.css': common('orbit.css'),
        '/widget-escaped.js': 'widget-escaped.js',
        '/widget-policy.js': 'widget-policy.js',
      },
      { root: import.meta.dirname },
    ),
  );
}

if (isMain(import.meta)) {
  createServer().listen(ports.app, '127.0.0.1', () =>
    console.log(`Widget: http://127.0.0.1:${ports.app}`),
  );
}
