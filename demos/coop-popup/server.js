import { serve, listener, isMain, demoPorts } from '../common/serve.js';

const ports = demoPorts(import.meta);

export function createServer({ providerOrigin, tls } = {}) {
  return listener(
    tls,
    serve(
      {
        '/': 'index.html',
        '/demo/coop-popup/no-coop': 'app/popup.html',
        '/demo/coop-popup/with-coop': 'app/popup.html',
        '/styles.css': 'styles.css',
        '/app/popup.js': 'app/popup.js',
        '/login/callback': 'app/callback.html',
        '/app/callback.js': 'app/callback.js',
        '/app-config.js': {
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
        '/provider/login/no-coop': 'provider/login.html',
        '/provider/login/with-coop': {
          file: 'provider/login.html',
          'Cross-Origin-Opener-Policy': 'same-origin',
        },
        '/styles.css': 'styles.css',
        '/provider/login.css': 'provider/login.css',
        '/provider/login.js': 'provider/login.js',
        '/provider-config.js': {
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
