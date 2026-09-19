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
        '/demo/broadcast/permissive': 'broadcast.html',
        '/demo/broadcast/host-coop': {
          file: 'broadcast.html',
          'Cross-Origin-Opener-Policy': 'same-origin',
        },
        '/demo/broadcast/restricted': 'broadcast.html',
        '/demo/broadcast/callback': 'callback.html',
        '/bff/login': bff.login,
        '/bff/callback': bff.callback,
        '/bff/user': bff.user,
        '/styles.css': common('styles.css'),
        '/broadcast.css': 'broadcast.css',
        '/broadcast.js': 'broadcast.js',
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
    () => console.log(`Popup login with BroadcastChannel: ${app}`),
  );
  createProviderServer({ appOrigin: app }).listen(
    ports.provider,
    '127.0.0.1',
    () => console.log(`Orbit ID: ${provider}`),
  );
}
