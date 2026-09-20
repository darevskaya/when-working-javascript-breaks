import { serve, listener, isMain, demoPorts } from '../common/serve.js';

const ports = demoPorts(import.meta);

// The profile page sends no policy. The stage test adds one to the document
// response, because that is what it teaches.
export function createServer({ tls } = {}) {
  return listener(
    tls,
    serve(
      {
        '/': 'index.html',
        '/demo/connect-src': 'api-page.html',
        '/styles.css': 'styles.css',
        '/api-call.js': 'api-call.js',
      },
      { root: import.meta.dirname },
    ),
  );
}

if (isMain(import.meta)) {
  createServer().listen(ports.app, '127.0.0.1', () =>
    console.log(`connect-src: http://127.0.0.1:${ports.app}`),
  );
}
