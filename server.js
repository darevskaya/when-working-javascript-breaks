import http from 'node:http';
import https from 'node:https';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createReportCollector } from './reporting.js';

const root = import.meta.dirname;
const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.map': 'application/json',
};

// Serves one route table. A row is a file path on its own, an object that adds
// the policy headers for that route or a generated body, or a function that
// answers the request. The server adds Content-Type and nothing
// else, so a row is the only place a header can come from, and the table is
// what the browser gets.
function serve(routes) {
  return async (request, response) => {
    const url = new URL(request.url, 'http://localhost');
    // Treat /demo/profile/ the same as /demo/profile.
    const pathname = url.pathname.replace(/(.)\/$/, '$1');
    const route = routes[pathname];

    if (!route) {
      response.writeHead(404);
      response.end('Not found');
      return;
    }
    // The /reports row is the collector itself. It writes its own response.
    if (typeof route === 'function') return route(request, response);

    const { file, body, ...headers } =
      typeof route === 'string' ? { file: route } : route;

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

// The reporting demo needs HTTPS, because Chromium does not deliver reports
// over plain HTTP. Every other demo runs over HTTP. See reporting-demo.js.
const listener = (tls, handler) =>
  tls ? https.createServer(tls, handler) : http.createServer(handler);

export function createServer({
  providerOrigin = 'http://127.0.0.1:4174',
  collector = createReportCollector(),
  tls,
} = {}) {
  return listener(
    tls,
    serve({
      // The index links to every page below, one link per mode.
      '/': 'demos/index.html',

      // Pages. Each mode of a demo is its own route, and the routes differ in
      // one header. The HTML and the JavaScript are the same in every mode.
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
      // The same policy, but this page starts the worker from a module file.
      '/demo/fractal/module': {
        file: 'demos/fractal/fractal.html',
        'Content-Security-Policy': "worker-src 'self'",
      },
      // The popup demo sets its header on the provider below, not here.
      '/demo/coop/permissive': 'demos/coop/coop.html',
      '/demo/coop/restricted': 'demos/coop/coop.html',
      // This row sends no policy. The Playwright test in demos/tests adds
      // one to this document's response, because that is what it teaches.
      '/demo/profile': 'demos/profile/profile.html',

      // Reporting examples. Reporting-Endpoints gives the receiver a name.
      // The policy then sends its reports to that name with report-to.
      '/demo/reporting': 'demos/reporting/index.html',
      '/demo/reporting/csp/enforce': {
        file: 'demos/reporting/example.html',
        'Reporting-Endpoints': 'demo="/reports"',
        'Content-Security-Policy': "script-src 'self'; report-to demo",
      },
      '/demo/reporting/csp/report-only': {
        file: 'demos/reporting/example.html',
        'Reporting-Endpoints': 'demo="/reports"',
        'Content-Security-Policy-Report-Only':
          "script-src 'self'; report-to demo",
      },
      // The legacy route names no receiver. report-uri holds the URL itself.
      '/demo/reporting/csp/legacy': {
        file: 'demos/reporting/example.html',
        'Content-Security-Policy': "script-src 'self'; report-uri /reports",
      },
      '/demo/reporting/coop/enforce': {
        file: 'demos/reporting/example.html',
        'Reporting-Endpoints': 'demo="/reports"',
        'Cross-Origin-Opener-Policy': 'same-origin; report-to="demo"',
      },
      '/demo/reporting/coop/report-only': {
        file: 'demos/reporting/example.html',
        'Reporting-Endpoints': 'demo="/reports"',
        'Cross-Origin-Opener-Policy-Report-Only':
          'same-origin; report-to="demo"',
      },
      '/demo/reporting/coep/enforce': {
        file: 'demos/reporting/example.html',
        'Reporting-Endpoints': 'demo="/reports"',
        'Cross-Origin-Embedder-Policy': 'require-corp; report-to="demo"',
      },
      '/demo/reporting/coep/report-only': {
        file: 'demos/reporting/example.html',
        'Reporting-Endpoints': 'demo="/reports"',
        'Cross-Origin-Embedder-Policy-Report-Only':
          'require-corp; report-to="demo"',
      },
      '/reporting.js': 'demos/reporting/reporting.js',
      // The receiver the rows above name. It writes its own response.
      '/reports': collector,

      // Files the pages ask for. No row here sends a policy header.
      '/styles.css': 'demos/common/styles.css',
      '/calculator.css': 'demos/calculator/calculator.css',
      '/calculator.js': 'demos/calculator/calculator.js',
      '/fractal.css': 'demos/fractal/fractal.css',
      '/fractal.js': 'demos/fractal/fractal.js',
      '/fractal-worker.js': 'demos/fractal/fractal-worker.js',
      '/worker-factory.js': 'demos/fractal/worker-factory.js',
      '/fractal-module-worker.js': 'demos/fractal/fractal-module-worker.js',
      '/coop.css': 'demos/coop/coop.css',
      '/coop.js': 'demos/coop/coop.js',
      '/profile.js': 'demos/profile/profile.js',
      '/bundles/dialog.js': 'dist/dialog.js',
      '/bundles/dialog.js.map': 'dist/dialog.js.map',
      '/coop-config.js': {
        body: `export const providerOrigin = '${providerOrigin}';\n`,
      },
    }),
  );
}

export function createProviderServer({
  appOrigin = 'http://127.0.0.1:4173',
  collector = createReportCollector(),
  tls,
} = {}) {
  return listener(
    tls,
    serve({
      // Both logins serve the same HTML. One extra header breaks the login.
      '/login/permissive': 'demos/coop/provider.html',
      '/login/restricted': {
        file: 'demos/coop/provider.html',
        'Cross-Origin-Opener-Policy': 'same-origin',
      },

      // The second origin the reporting examples reach for.
      '/reporting-popup': 'demos/reporting/popup.html',
      '/reporting-resource.js': {
        body: '// A script served by the second origin.\n',
      },
      '/reports': collector,

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
  const collector = createReportCollector();
  createServer({
    providerOrigin: `http://127.0.0.1:${providerPort}`,
    collector,
  }).listen(port, '127.0.0.1', () =>
    console.log(`Demos: http://127.0.0.1:${port}`),
  );
  createProviderServer({
    appOrigin: `http://127.0.0.1:${port}`,
    collector,
  }).listen(providerPort, '127.0.0.1', () =>
    console.log(`Identity provider: http://127.0.0.1:${providerPort}`),
  );
}
