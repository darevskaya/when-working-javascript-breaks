import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.map': 'application/json',
};

export function createServer() {
  return http.createServer(async (request, response) => {
    const url = new URL(request.url, 'http://localhost');
    const baseline = url.pathname === '/demo/eval/permissive';
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader(
      'Content-Security-Policy',
      `default-src 'self'; script-src 'self'${baseline ? " 'unsafe-eval'" : ''}; style-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'self'`,
    );
    if (url.pathname === '/') {
      response.writeHead(302, { Location: '/demo/eval/permissive?build=eval' });
      response.end();
      return;
    }
    const routes = {
      '/demo/eval/permissive': 'public/account.html',
      '/demo/eval/restricted': 'public/account.html',
      '/styles.css': 'public/styles.css',
      '/lab.js': 'public/lab.js',
      '/account.js': 'public/account.js',
      '/bundles/eval/dialog.js': 'dist/eval/dialog.js',
      '/bundles/eval/dialog.js.map': 'dist/eval/dialog.js.map',
      '/bundles/fixed/dialog.js': 'dist/fixed/dialog.js',
      '/bundles/fixed/dialog.js.map': 'dist/fixed/dialog.js.map',
    };
    const file = routes[url.pathname];
    if (!file) {
      response.writeHead(404);
      response.end('Not found');
      return;
    }
    try {
      const body = await readFile(path.join(root, file));
      response.writeHead(200, { 'Content-Type': types[path.extname(file)] });
      response.end(body);
    } catch (error) {
      response.writeHead(error.code === 'ENOENT' ? 404 : 500);
      response.end(
        'File unavailable. Run npm run build before starting the server.',
      );
    }
  });
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const port = Number(process.env.PORT || 4173);
  createServer().listen(port, '127.0.0.1', () =>
    console.log(`When Working JavaScript Breaks: http://127.0.0.1:${port}`),
  );
}
