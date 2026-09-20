import { serve, listener, isMain } from './serve.js';
import { hub } from './demos.js';

// The hub page. It lists every demo from demos.js and links to its port. It
// serves demos.js to the page, so the list has one source.
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
