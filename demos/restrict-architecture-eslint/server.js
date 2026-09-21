import { serve, listener, isMain, demoPorts } from '../common/serve.js';
import { config } from './config.js';

const ports = demoPorts(import.meta);

// The policy comes from config.js, the same file that the API client reads
// and the only file that lint lets name an origin. The two cannot drift.
const origins = Object.values(config);
const fromConfig = `connect-src 'self' ${origins.join(' ')}`;

// A customer who allows the page origin and nothing else.
const narrow = "connect-src 'self'";

const page = (csp) => ({
  file: 'app.html',
  'Content-Security-Policy': csp,
});

export function createServer({ tls } = {}) {
  return listener(
    tls,
    serve(
      {
        '/': 'index.html',
        '/demo/restrict-architecture-eslint/from-config': page(fromConfig),
        '/demo/restrict-architecture-eslint/narrow-policy': page(narrow),
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

// The API on the origin that config.js names. It lets the app origin read its
// answers.
export function createApiServer({ appOrigin, tls } = {}) {
  const json = (value) => ({
    body: JSON.stringify(value),
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': appOrigin,
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

// The API always listens on the port inside config.apiOrigin.
export const apiPort = Number(new URL(config.apiOrigin).port);

if (isMain(import.meta)) {
  const app = `http://127.0.0.1:${ports.app}`;
  createServer().listen(ports.app, '127.0.0.1', () =>
    console.log(`restrict-architecture-eslint: ${app}`),
  );
  createApiServer({ appOrigin: app }).listen(apiPort, '127.0.0.1', () =>
    console.log(`API: ${config.apiOrigin}`),
  );
}
