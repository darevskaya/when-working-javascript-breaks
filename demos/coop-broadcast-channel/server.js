import { serve, listener, common, isMain, ports } from '../common/serve.js';
import { createOrbitIdServer } from '../common/orbit-id.js';
import { createBff } from './bff.js';
import { createOrbitAuth } from './orbit-auth.js';

// The same three COOP modes as the COOP demo, with a login that returns
// through a callback page and a BroadcastChannel. It needs no window
// reference, and the BFF keeps the token on the server.
export function createServer({ providerOrigin, tls } = {}) {
  const bff = createBff({ providerOrigin, tls });
  return listener(
    tls,
    serve(
      {
        '/': 'index.html',
        '/demo/coop-broadcast-channel/no-coop': 'channel-login.html',
        '/demo/coop-broadcast-channel/coop-on-app': {
          file: 'channel-login.html',
          'Cross-Origin-Opener-Policy': 'same-origin',
        },
        '/demo/coop-broadcast-channel/coop-on-login': 'channel-login.html',
        '/demo/coop-broadcast-channel/callback': 'callback.html',
        '/bff/login': bff.login,
        '/bff/callback': bff.callback,
        '/bff/user': bff.user,
        '/styles.css': common('styles.css'),
        '/channel-login.css': 'channel-login.css',
        '/channel-login.js': 'channel-login.js',
        '/callback.js': 'callback.js',
      },
      { root: import.meta.dirname },
    ),
  );
}

// Orbit ID with the authorization code endpoints for the BFF login.
export function createProviderServer({ appOrigin, tls } = {}) {
  const auth = createOrbitAuth({ appOrigin });
  return createOrbitIdServer({
    appOrigin,
    tls,
    routes: { '/login/approve': auth.approve, '/token': auth.token },
  });
}

if (isMain(import.meta)) {
  const app = `http://127.0.0.1:${ports.app}`;
  const provider = `http://127.0.0.1:${ports.provider}`;
  createServer({ providerOrigin: provider }).listen(
    ports.app,
    '127.0.0.1',
    () => console.log(`coop-broadcast-channel: ${app}`),
  );
  createProviderServer({ appOrigin: app }).listen(
    ports.provider,
    '127.0.0.1',
    () => console.log(`Orbit ID: ${provider}`),
  );
}
