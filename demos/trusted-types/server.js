import { serve, listener, isMain, demoPorts } from '../common/serve.js';

const ports = demoPorts(import.meta);

// Both pages require Trusted Types. They differ in the policy list, and in the
// widget script that the list allows.
export function createServer({ tls } = {}) {
  const trustedTypes = "require-trusted-types-for 'script'";
  return listener(
    tls,
    serve(
      {
        '/': 'index.html',
        // No policy at all, so no string becomes markup on this page.
        '/demo/trusted-types/no-policy': {
          file: 'no-policy.html',
          'Content-Security-Policy': `${trustedTypes}; trusted-types 'none'`,
        },
        // One policy name. setHTML() in the trusted-html package owns it.
        '/demo/trusted-types/one-policy': {
          file: 'one-policy.html',
          'Content-Security-Policy': `${trustedTypes}; trusted-types orbit-widget`,
        },
        '/styles.css': 'styles.css',
        '/orbit.css': 'orbit.css',
        '/dom-widget.js': 'dom-widget.js',
        '/policy-widget.js': 'policy-widget.js',
        '/policy-probe.js': 'policy-probe.js',
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
