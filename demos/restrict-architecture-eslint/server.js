import { serve, listener, isMain, demoPorts } from '../common/serve.js';

const ports = demoPorts(import.meta);

export function createServer({ tls } = {}) {
  return listener(
    tls,
    serve(
      {
        '/': 'index.html',
        '/demo/restrict-architecture-eslint': 'app.html',
        '/styles.css': 'styles.css',
        '/app.css': 'app.css',
        '/app.js': 'app.js',
        '/worker-factory.js': 'worker-factory.js',
        '/tasks.worker.js': 'tasks.worker.js',
      },
      { root: import.meta.dirname },
    ),
  );
}

if (isMain(import.meta)) {
  const app = `http://127.0.0.1:${ports.app}`;
  createServer().listen(ports.app, '127.0.0.1', () =>
    console.log(`restrict-architecture-eslint: ${app}`),
  );
}
