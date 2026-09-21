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

// Routes own policy headers; relative files resolve from root.
export function serve(routes, { root }) {
  return async (request, response) => {
    const url = new URL(request.url, 'http://localhost');
    // Strip trailing slashes except at root.
    const pathname = url.pathname.replace(/(.)\/$/, '$1');
    const route = routes[pathname];

    if (!route) {
      response.writeHead(404);
      response.end('Not found');
      return;
    }
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

export const listener = (tls, handler) =>
  tls ? https.createServer(tls, handler) : http.createServer(handler);

export const isMain = (meta) =>
  meta.filename === path.resolve(process.argv[1] ?? '');

export function demoPorts(meta) {
  const { port, providerPort } = demo(
    path.basename(path.dirname(meta.filename)),
  );
  return {
    app: Number(process.env.PORT || port),
    provider: Number(process.env.PROVIDER_PORT || providerPort || port + 100),
  };
}
