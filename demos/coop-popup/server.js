import { serve, listener, common, isMain, ports } from '../common/serve.js';
import { createOrbitIdServer } from '../common/orbit-id.js';

// The popup login app. Either side can send COOP: the host-coop page sends it
// here, and the restricted page opens the Orbit ID login that sends it.
export function createServer({ providerOrigin, tls } = {}) {
  return listener(
    tls,
    serve(
      {
        '/': 'index.html',
        '/demo/coop/permissive': 'coop.html',
        '/demo/coop/host-coop': {
          file: 'coop.html',
          'Cross-Origin-Opener-Policy': 'same-origin',
        },
        '/demo/coop/restricted': 'coop.html',
        '/styles.css': common('styles.css'),
        '/coop.css': 'coop.css',
        '/coop.js': 'coop.js',
        '/coop-config.js': {
          body: `export const providerOrigin = '${providerOrigin}';\n`,
        },
      },
      { root: import.meta.dirname },
    ),
  );
}

export const createProviderServer = createOrbitIdServer;

if (isMain(import.meta)) {
  const app = `http://127.0.0.1:${ports.app}`;
  const provider = `http://127.0.0.1:${ports.provider}`;
  createServer({ providerOrigin: provider }).listen(
    ports.app,
    '127.0.0.1',
    () => console.log(`Popup login: ${app}`),
  );
  createProviderServer({ appOrigin: app }).listen(
    ports.provider,
    '127.0.0.1',
    () => console.log(`Orbit ID: ${provider}`),
  );
}
