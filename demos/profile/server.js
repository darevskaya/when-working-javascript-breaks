import { serve, listener, common, isMain, ports } from '../common/serve.js';

// The profile page sends no policy. The stage test adds one to the document
// response, because that is what it teaches.
export function createServer({ tls } = {}) {
  return listener(
    tls,
    serve(
      {
        '/': 'index.html',
        '/demo/profile': 'profile.html',
        '/styles.css': common('styles.css'),
        '/profile.js': 'profile.js',
      },
      { root: import.meta.dirname },
    ),
  );
}

if (isMain(import.meta)) {
  createServer().listen(ports.app, '127.0.0.1', () =>
    console.log(`Profile: http://127.0.0.1:${ports.app}`),
  );
}
