import { serve, listener, common } from './serve.js';

// Orbit ID, the fake identity provider on a second origin. The COOP,
// broadcast, and embed demos start it next to their own server. Each demo can
// add routes, for example the frame that the embed demo loads.
export function createOrbitIdServer({ appOrigin, routes = {}, tls } = {}) {
  return listener(
    tls,
    serve(
      {
        // Both logins serve the same HTML. One extra header breaks the popup.
        '/login/permissive': common('provider.html'),
        '/login/restricted': {
          file: common('provider.html'),
          'Cross-Origin-Opener-Policy': 'same-origin',
        },
        '/styles.css': common('styles.css'),
        '/provider.css': common('provider.css'),
        '/provider.js': common('provider.js'),
        '/provider-config.js': {
          body: `export const appOrigin = '${appOrigin}';\n`,
        },
        ...routes,
      },
      { root: import.meta.dirname },
    ),
  );
}
