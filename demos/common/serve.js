import http from 'node:http';
import https from 'node:https';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { demo } from './demos.js';

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.map': 'application/json',
};

// Serves one route table. A row is a file path on its own, an object that adds
// the policy headers for that route or a generated body, or a function that
// answers the request. The server adds Content-Type and nothing else, so a row
// is the only place a header can come from, and the table is what the browser
// gets. A relative file path starts at root, the folder of the demo.
export function serve(routes, { root }) {
  return async (request, response) => {
    const url = new URL(request.url, 'http://localhost');
    // Treat /demo/connect-src/ the same as /demo/connect-src.
    const pathname = url.pathname.replace(/(.)\/$/, '$1');
    const route = routes[pathname];

    if (!route) {
      response.writeHead(404);
      response.end('Not found');
      return;
    }
    // A function row writes its own response.
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
      const content = await readFile(path.resolve(root, file));
      const type = contentTypes[path.extname(file)];
      response.writeHead(200, { 'Content-Type': type, ...headers });
      response.end(content);
    } catch {
      response.writeHead(500);
      response.end('File unavailable.');
    }
  };
}

// An HTTP server, or an HTTPS server when tls holds a key and a certificate.
export const listener = (tls, handler) =>
  tls ? https.createServer(tls, handler) : http.createServer(handler);

// True when this module is the script that node started.
export const isMain = (meta) =>
  meta.filename === path.resolve(process.argv[1] ?? '');

// The ports of one demo, from demos/common/demos.js. Each demo has its own
// pair, so every demo can run at the same time. PORT and PROVIDER_PORT
// override them, which is what the Playwright configuration does.
export function demoPorts(meta) {
  const { port, providerPort } = demo(
    path.basename(path.dirname(meta.filename)),
  );
  return {
    app: Number(process.env.PORT || port),
    provider: Number(process.env.PROVIDER_PORT || providerPort || port + 100),
  };
}
