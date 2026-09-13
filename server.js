import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = import.meta.dirname;
const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.map': 'application/json',
};

// Serves one route table. A route names a file to send, or a body to generate,
// plus the response headers for it. The server adds Content-Type and nothing
// else, so the table below is exactly what the Network tab shows.
function serve(routes, redirects = {}) {
  return async (request, response) => {
    const url = new URL(request.url, 'http://localhost');
    // Treat /demo/calculator/ the same as /demo/calculator.
    const pathname = url.pathname.replace(/(.)\/$/, '$1');

    if (redirects[pathname]) {
      response.writeHead(302, { Location: redirects[pathname] });
      response.end();
      return;
    }
    const route = routes[pathname];
    if (!route) {
      response.writeHead(404);
      response.end('Not found');
      return;
    }
    const { file, body, ...headers } = route;
    if (body !== undefined) {
      response.writeHead(200, {
        'Content-Type': contentTypes['.js'],
        ...headers,
      });
      response.end(body);
      return;
    }
    try {
      const content = await readFile(path.join(root, file));
      const type = contentTypes[path.extname(file)];
      response.writeHead(200, { 'Content-Type': type, ...headers });
      response.end(content);
    } catch {
      response.writeHead(500);
      response.end(
        'File unavailable. Run npm run build before starting the server.',
      );
    }
  };
}

export function createServer({ providerPort = 4174 } = {}) {
  return http.createServer(
    serve(
      {
        // The switch on the page changes the route, and the route changes one
        // header. The HTML and the JavaScript are the same in both rows.
        '/demo/calculator/permissive': {
          file: 'public/calculator.html',
          'Content-Security-Policy': "script-src 'self' 'unsafe-eval'",
        },
        '/demo/calculator/restricted': {
          file: 'public/calculator.html',
          'Content-Security-Policy': "script-src 'self'",
        },
        '/demo/fractal/permissive': {
          file: 'public/fractal.html',
          'Content-Security-Policy': "worker-src 'self' blob:",
        },
        '/demo/fractal/restricted': {
          file: 'public/fractal.html',
          'Content-Security-Policy': "worker-src 'self'",
        },
        // The popup demo sets its header on the provider below, not here.
        '/demo/coop/permissive': { file: 'public/coop.html' },
        '/demo/coop/restricted': { file: 'public/coop.html' },
        // This row sends no policy. The Playwright test in demos/profile adds
        // one to this document's response, because that is what it teaches.
        '/demo/profile': { file: 'public/profile.html' },

        '/styles.css': { file: 'public/styles.css' },
        '/calculator.js': { file: 'public/calculator.js' },
        '/fractal.js': { file: 'public/fractal.js' },
        '/fractal-worker.js': { file: 'public/fractal-worker.js' },
        '/coop.js': { file: 'public/coop.js' },
        '/profile.js': { file: 'public/profile.js' },
        '/bundles/dialog.js': { file: 'dist/dialog.js' },
        '/bundles/dialog.js.map': { file: 'dist/dialog.js.map' },
        '/coop-config.js': {
          body: `export const providerOrigin = 'http://127.0.0.1:${providerPort}';\n`,
        },
      },
      {
        '/': '/demo/calculator/permissive',
        '/demo/calculator': '/demo/calculator/permissive',
        '/demo/fractal': '/demo/fractal/permissive',
        '/demo/coop': '/demo/coop/permissive',
      },
    ),
  );
}

export function createProviderServer({
  appOrigin = 'http://127.0.0.1:4173',
} = {}) {
  return http.createServer(
    serve({
      // Both logins serve the same HTML. One extra header breaks the login.
      '/login/permissive': { file: 'public/provider.html' },
      '/login/restricted': {
        file: 'public/provider.html',
        'Cross-Origin-Opener-Policy': 'same-origin',
      },

      '/styles.css': { file: 'public/styles.css' },
      '/provider.css': { file: 'public/provider.css' },
      '/provider.js': { file: 'public/provider.js' },
      '/provider-config.js': {
        body: `export const appOrigin = '${appOrigin}';\n`,
      },
    }),
  );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const port = Number(process.env.PORT || 4173);
  const providerPort = Number(process.env.PROVIDER_PORT || 4174);
  createServer({ providerPort }).listen(port, '127.0.0.1', () =>
    console.log(`Demos: http://127.0.0.1:${port}`),
  );
  createProviderServer({ appOrigin: `http://127.0.0.1:${port}` }).listen(
    providerPort,
    '127.0.0.1',
    () => console.log(`Identity provider: http://127.0.0.1:${providerPort}`),
  );
}
