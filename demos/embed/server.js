import { serve, listener, common, isMain, ports } from '../common/serve.js';
import { createOrbitIdServer } from '../common/orbit-id.js';

// The shop embeds the Orbit ID frame. These pages send no policy. They differ
// in the sandbox attribute on the iframe, which embed.js reads from the path.
export function createServer({ providerOrigin, tls } = {}) {
  return listener(
    tls,
    serve(
      {
        '/': 'index.html',
        '/demo/embed/no-sandbox': 'embed.html',
        '/demo/embed/no-top-navigation': 'embed.html',
        '/demo/embed/user-activation': 'embed.html',
        '/styles.css': common('styles.css'),
        '/shop.css': common('shop.css'),
        '/embed.css': 'embed.css',
        '/embed.js': 'embed.js',
        '/orbit-loader.js': 'orbit-loader.js',
        '/embed-config.js': {
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
      '/embed': `${import.meta.dirname}/frame.html`,
      '/frame.js': `${import.meta.dirname}/frame.js`,
      '/orbit.css': common('orbit.css'),
      '/login/embed': common('provider.html'),
    },
  });
}

if (isMain(import.meta)) {
  const app = `http://127.0.0.1:${ports.app}`;
  const provider = `http://127.0.0.1:${ports.provider}`;
  createServer({ providerOrigin: provider }).listen(
    ports.app,
    '127.0.0.1',
    () => console.log(`Embedded frame: ${app}`),
  );
  createProviderServer({ appOrigin: app }).listen(
    ports.provider,
    '127.0.0.1',
    () => console.log(`Orbit ID: ${provider}`),
  );
}
