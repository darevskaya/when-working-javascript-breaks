import { serve, listener, isMain, demoPorts } from '../common/serve.js';
import { config } from './config.js';

const ports = demoPorts(import.meta);

export const appOrigin = `http://127.0.0.1:${ports.app}`;

// Share the worker script with the client to prevent policy drift.
export const fromConfig = (origin) =>
  `worker-src ${origin}${config.workerScript}`;

const narrow = "worker-src 'none'";

const page = (csp) => ({
  file: 'app.html',
  'Content-Security-Policy': csp,
});

export function createServer({ origin = appOrigin, tls } = {}) {
  return listener(
    tls,
    serve(
      {
        '/': 'index.html',
        '/demo/worker-src-eslint/from-config': page(fromConfig(origin)),
        '/demo/worker-src-eslint/narrow-policy': page(narrow),
        '/styles.css': 'styles.css',
        '/app.css': 'app.css',
        '/app.js': 'app.js',
        '/worker-client.js': 'worker-client.js',
        '/config.js': 'config.js',
        [config.workerScript]: 'tasks.worker.js',
      },
      { root: import.meta.dirname },
    ),
  );
}

if (isMain(import.meta)) {
  createServer().listen(ports.app, '127.0.0.1', () =>
    console.log(`worker-src-eslint: ${appOrigin}`),
  );
}
