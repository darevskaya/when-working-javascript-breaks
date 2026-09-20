import { serve, listener, isMain, demoPorts } from '../common/serve.js';

const ports = demoPorts(import.meta);
import { apiOrigins, apiPort } from './contract.js';

// The page sends connect-src with the origins in contract.js, the same list
// that lint checks.
export function createServer({ tls } = {}) {
  return listener(
    tls,
    serve(
      {
        '/': 'index.html',
        '/demo/connect-src-api-client/api-calls': {
          file: 'app.html',
          'Content-Security-Policy': `connect-src 'self' ${apiOrigins.join(' ')}`,
        },
        '/styles.css': 'styles.css',
        '/app.css': 'app.css',
        '/app.js': 'app.js',
        '/api-client.js': 'api-client.js',
        '/config.js': 'config.js',
      },
      { root: import.meta.dirname },
    ),
  );
}

// The API on the contract origin. It lets the app origin read its answers.
export function createApiServer({ appOrigin, tls } = {}) {
  const cors = { 'Access-Control-Allow-Origin': appOrigin };
  const json = (value) => ({
    body: JSON.stringify(value),
    'Content-Type': 'application/json',
    ...cors,
  });
  return listener(
    tls,
    serve(
      {
        '/profile': json({ name: 'Elena' }),
        '/status': json({ status: 'ok' }),
      },
      { root: import.meta.dirname },
    ),
  );
}

if (isMain(import.meta)) {
  const app = `http://127.0.0.1:${ports.app}`;
  createServer().listen(ports.app, '127.0.0.1', () =>
    console.log(`connect-src-api-client: ${app}`),
  );
  createApiServer({ appOrigin: app }).listen(apiPort, '127.0.0.1', () =>
    console.log(`API: ${apiOrigins[0]}`),
  );
}
