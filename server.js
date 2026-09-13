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

// Serves one route table. A row is either a file path on its own, or an object
// that adds the one policy header for that route, a redirect, or a generated
// body. The server adds Content-Type and nothing else, so a row with braces is
// the only place a header can come from, and the table is what the browser gets.
function serve(routes) {
  return async (request, response) => {
    const url = new URL(request.url, 'http://localhost');
    // Treat /demo/calculator/ the same as /demo/calculator.
    const pathname = url.pathname.replace(/(.)\/$/, '$1');
    const route = routes[pathname];

    if (!route) {
      response.writeHead(404);
      response.end('Not found');
      return;
    }
    const { file, body, redirect, ...headers } =
      typeof route === 'string' ? { file: route } : route;

    if (redirect) {
      response.writeHead(302, { Location: redirect });
      response.end();
      return;
    }
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
    serve({
      // Pages. The switch on the page changes the route, and the route changes
      // one header. The HTML and the JavaScript are the same in both rows.
      '/demo/calculator/permissive': {
        file: 'demos/calculator/calculator.html',
        'Content-Security-Policy': "script-src 'self' 'unsafe-eval'",
      },
      '/demo/calculator/restricted': {
        file: 'demos/calculator/calculator.html',
        'Content-Security-Policy': "script-src 'self'",
      },
      '/demo/fractal/permissive': {
        file: 'demos/fractal/fractal.html',
        'Content-Security-Policy': "worker-src 'self' blob:",
      },
      '/demo/fractal/restricted': {
        file: 'demos/fractal/fractal.html',
        'Content-Security-Policy': "worker-src 'self'",
      },
      // The popup demo sets its header on the provider below, not here.
      '/demo/coop/permissive': 'demos/coop/coop.html',
      '/demo/coop/restricted': 'demos/coop/coop.html',
      // This row sends no policy. The Playwright test in demos/tests adds
      // one to this document's response, because that is what it teaches.
      '/demo/profile': 'demos/profile/profile.html',

      // Short URLs for the talk. Each one opens the permissive route.
      '/': { redirect: '/demo/calculator/permissive' },
      '/demo/calculator': { redirect: '/demo/calculator/permissive' },
      '/demo/fractal': { redirect: '/demo/fractal/permissive' },
      '/demo/coop': { redirect: '/demo/coop/permissive' },

      // Files the pages ask for. No row here sends a policy header.
      '/styles.css': 'demos/common/styles.css',
      '/calculator.css': 'demos/calculator/calculator.css',
      '/calculator.js': 'demos/calculator/calculator.js',
      '/fractal.css': 'demos/fractal/fractal.css',
      '/fractal.js': 'demos/fractal/fractal.js',
      '/fractal-worker.js': 'demos/fractal/fractal-worker.js',
      '/coop.css': 'demos/coop/coop.css',
      '/coop.js': 'demos/coop/coop.js',
      '/profile.js': 'demos/profile/profile.js',
      '/bundles/dialog.js': 'dist/dialog.js',
      '/bundles/dialog.js.map': 'dist/dialog.js.map',
      '/coop-config.js': {
        body: `export const providerOrigin = 'http://127.0.0.1:${providerPort}';\n`,
      },
    }),
  );
}

export function createProviderServer({
  appOrigin = 'http://127.0.0.1:4173',
} = {}) {
  return http.createServer(
    serve({
      // Both logins serve the same HTML. One extra header breaks the login.
      '/login/permissive': 'demos/coop/provider.html',
      '/login/restricted': {
        file: 'demos/coop/provider.html',
        'Cross-Origin-Opener-Policy': 'same-origin',
      },

      '/styles.css': 'demos/common/styles.css',
      '/provider.css': 'demos/coop/provider.css',
      '/provider.js': 'demos/coop/provider.js',
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
