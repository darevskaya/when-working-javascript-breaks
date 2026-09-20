import { serve, listener, isMain, demoPorts } from '../common/serve.js';

const ports = demoPorts(import.meta);
import { modes } from './routes.js';

// One page in three modes. The headers of each mode come from routes.js, and
// the page reads the same list, so the screen names the headers it got.
export function createServer({ tls } = {}) {
  const pages = Object.fromEntries(
    modes.map((mode) => [mode.path, { file: 'app.html', ...mode.headers }]),
  );
  return listener(
    tls,
    serve(
      {
        '/': 'index.html',
        ...pages,
        '/styles.css': 'styles.css',
        '/app.css': 'app.css',
        '/app.js': 'app.js',
        '/preconditions.js': 'preconditions.js',
        '/routes.js': 'routes.js',
        '/service-worker.js': 'service-worker.js',
      },
      { root: import.meta.dirname },
    ),
  );
}

if (isMain(import.meta)) {
  createServer().listen(ports.app, '127.0.0.1', () =>
    console.log(`api-preconditions: http://127.0.0.1:${ports.app}`),
  );
}
