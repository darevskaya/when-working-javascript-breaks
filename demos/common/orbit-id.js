import { serve, listener, common } from './serve.js';

// Orbit ID, the fake identity provider on a second origin. The coop-popup,
// coop-broadcast-channel, and iframe-sandbox demos start it next to their own
// server. Each demo can add routes, for example the frame that iframe-sandbox
// loads.
export function createOrbitIdServer({ appOrigin, routes = {}, tls } = {}) {
  return listener(
    tls,
    serve(
      {
        // Both logins serve the same HTML. One extra header breaks the popup.
        '/login/no-coop': common('orbit-login.html'),
        '/login/coop': {
          file: common('orbit-login.html'),
          'Cross-Origin-Opener-Policy': 'same-origin',
        },
        '/styles.css': common('styles.css'),
        '/orbit-login.css': common('orbit-login.css'),
        '/orbit-login.js': common('orbit-login.js'),
        '/orbit-login-config.js': {
          body: `export const appOrigin = '${appOrigin}';\n`,
        },
        ...routes,
      },
      { root: import.meta.dirname },
    ),
  );
}
