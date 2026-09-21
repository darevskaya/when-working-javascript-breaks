import { serve, listener, isMain } from './serve.js';
import { hub } from './demos.js';

export function createHub({ tls } = {}) {
  return listener(
    tls,
    serve(
      {
        '/': 'hub.html',
        '/hub.css': 'hub.css',
        '/hub-page.js': 'hub-page.js',
        '/demos.js': 'demos.js',
      },
      { root: import.meta.dirname },
    ),
  );
}

if (isMain(import.meta)) {
  createHub().listen(hub.port, '127.0.0.1', () =>
    console.log(`hub: http://127.0.0.1:${hub.port}`),
  );
}
