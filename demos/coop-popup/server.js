import { serve, listener, isMain, demoPorts } from '../common/serve.js';

const ports = demoPorts(import.meta);

export function createServer({ providerOrigin, tls } = {}) {
  return listener(
    tls,
    serve(
      {
        '/': 'index.html',
        '/demo/coop-popup/no-coop': 'popup-login.html',
        '/demo/coop-popup/coop-on-app': {
          file: 'popup-login.html',
          'Cross-Origin-Opener-Policy': 'same-origin',
        },
        '/demo/coop-popup/coop-on-login': 'popup-login.html',
        '/styles.css': 'styles.css',
        '/popup-login.js': 'popup-login.js',
        '/login-config.js': {
          body: `export const providerOrigin = '${providerOrigin}';\n`,
        },
      },
      { root: import.meta.dirname },
    ),
  );
}

export function createProviderServer({ appOrigin, tls } = {}) {
  return listener(
    tls,
    serve(
      {
        '/login/no-coop': 'orbit-login.html',
        '/login/coop': {
          file: 'orbit-login.html',
          'Cross-Origin-Opener-Policy': 'same-origin',
        },
        '/styles.css': 'styles.css',
        '/orbit-login.css': 'orbit-login.css',
        '/orbit-login.js': 'orbit-login.js',
        '/orbit-login-config.js': {
          body: `export const appOrigin = '${appOrigin}';
`,
        },
      },
      { root: import.meta.dirname },
    ),
  );
}

if (isMain(import.meta)) {
  const app = `http://127.0.0.1:${ports.app}`;
  const provider = `http://127.0.0.1:${ports.provider}`;
  createServer({ providerOrigin: provider }).listen(
    ports.app,
    '127.0.0.1',
    () => console.log(`coop-popup: ${app}`),
  );
  createProviderServer({ appOrigin: app }).listen(
    ports.provider,
    '127.0.0.1',
    () => console.log(`Orbit ID: ${provider}`),
  );
}
