import { serve, listener, isMain, ports } from '../common/serve.js';

// The page embeds the Orbit ID frame. These pages send no policy. They differ
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
        '/styles.css': 'styles.css',
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

// Orbit ID, the fake identity provider on the second origin. It serves the
// frame and the login that the frame redirects to.
export function createProviderServer({ appOrigin, tls } = {}) {
  return listener(
    tls,
    serve(
      {
        '/frame': 'redirect-frame.html',
        '/redirect-frame.js': 'redirect-frame.js',
        '/login/redirect': 'orbit-login.html',
        '/styles.css': 'styles.css',
        '/orbit.css': 'orbit.css',
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
    () => console.log(`iframe-sandbox: ${app}`),
  );
  createProviderServer({ appOrigin: app }).listen(
    ports.provider,
    '127.0.0.1',
    () => console.log(`Orbit ID: ${provider}`),
  );
}
