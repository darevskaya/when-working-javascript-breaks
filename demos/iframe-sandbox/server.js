import { serve, listener, common, isMain, ports } from '../common/serve.js';
import { createOrbitIdServer } from '../common/orbit-id.js';

// The shop embeds the Orbit ID frame. These pages send no policy. They differ
// in the sandbox attribute on the iframe, which host-page.js reads from the path.
export function createServer({ providerOrigin, tls } = {}) {
  return listener(
    tls,
    serve(
      {
        '/': 'index.html',
        '/demo/iframe-sandbox/no-sandbox': 'host-page.html',
        '/demo/iframe-sandbox/sandbox-without-top-navigation': 'host-page.html',
        '/demo/iframe-sandbox/top-navigation-by-user-activation':
          'host-page.html',
        '/styles.css': common('styles.css'),
        '/shop.css': common('shop.css'),
        '/host-page.css': 'host-page.css',
        '/host-page.js': 'host-page.js',
        '/frame-loader.js': 'frame-loader.js',
        '/frame-config.js': {
          body: `export const providerOrigin = '${providerOrigin}';\n`,
        },
      },
      { root: import.meta.dirname },
    ),
  );
}

// Orbit ID with the frame and the login that the frame redirects to.
export function createProviderServer({ appOrigin, tls } = {}) {
  return createOrbitIdServer({
    appOrigin,
    tls,
    routes: {
      '/frame': `${import.meta.dirname}/redirect-frame.html`,
      '/redirect-frame.js': `${import.meta.dirname}/redirect-frame.js`,
      '/orbit.css': common('orbit.css'),
      '/login/redirect': common('orbit-login.html'),
    },
  });
}

if (isMain(import.meta)) {
  const app = `http://127.0.0.1:${ports.app}`;
  const provider = `http://127.0.0.1:${ports.provider}`;
  createServer({ providerOrigin: provider }).listen(
    ports.app,
    '127.0.0.1',
    () => console.log(`iframe-sandbox: ${app}`),
  );
  createProviderServer({ appOrigin: app }).listen(
    ports.provider,
    '127.0.0.1',
    () => console.log(`Orbit ID: ${provider}`),
  );
}
