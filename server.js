import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = import.meta.dirname;
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.map': 'application/json',
};

const assets = {
  '/styles.css': 'public/styles.css',
  '/calculator.js': 'public/calculator.js',
  '/fractal.js': 'public/fractal.js',
  '/coop.js': 'public/coop.js',
  '/fractal-worker.js': 'public/fractal-worker.js',
  '/bundles/dialog.js': 'dist/dialog.js',
  '/bundles/dialog.js.map': 'dist/dialog.js.map',
};

async function serveFile(response, file) {
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
}

function serveModule(response, source) {
  response.writeHead(200, { 'Content-Type': types['.js'] });
  response.end(source);
}

function notFound(response) {
  response.writeHead(404);
  response.end('Not found');
}

export function createServer({ providerPort = 4174 } = {}) {
  return http.createServer(async (request, response) => {
    const url = new URL(request.url, 'http://localhost');
    const [, demo, policy] =
      url.pathname.match(
        /^\/demo\/(calculator|fractal|coop)(?:\/(permissive|restricted)?)?$/,
      ) ?? [];

    // Only these two lines differ between the demos. Everything else is fixed.
    const directives = [
      "default-src 'self'",
      `script-src 'self'${demo === 'calculator' && policy === 'permissive' ? " 'unsafe-eval'" : ''}`,
    ];
    if (demo === 'fractal') {
      directives.push(
        `worker-src 'self'${policy === 'permissive' ? ' blob:' : ''}`,
      );
    }
    directives.push(
      "style-src 'self'",
      "object-src 'none'",
      "base-uri 'none'",
      "frame-ancestors 'self'",
    );
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Content-Security-Policy', directives.join('; '));

    if (url.pathname === '/coop-config.js') {
      serveModule(
        response,
        `export const providerOrigin = 'http://127.0.0.1:${providerPort}';\n`,
      );
      return;
    }
    if (url.pathname === '/' || (demo && !policy)) {
      response.writeHead(302, {
        Location: `/demo/${demo ?? 'calculator'}/permissive`,
      });
      response.end();
      return;
    }
    const file = policy ? `public/${demo}.html` : assets[url.pathname];
    if (!file) {
      notFound(response);
      return;
    }
    await serveFile(response, file);
  });
}

export function createProviderServer({
  appOrigin = 'http://127.0.0.1:4173',
} = {}) {
  const files = {
    '/provider.js': 'public/provider.js',
    '/provider.css': 'public/provider.css',
    '/styles.css': 'public/styles.css',
  };
  return http.createServer(async (request, response) => {
    const url = new URL(request.url, 'http://localhost');
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
    );
    if (url.pathname === '/provider-config.js') {
      serveModule(response, `export const appOrigin = '${appOrigin}';\n`);
      return;
    }
    const login = /^\/login\/(permissive|restricted)$/.exec(url.pathname);
    // The only difference between the two logins: one extra response header.
    if (login?.[1] === 'restricted') {
      response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    }
    const file = login ? 'public/provider.html' : files[url.pathname];
    if (!file) {
      notFound(response);
      return;
    }
    await serveFile(response, file);
  });
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const port = Number(process.env.PORT || 4173);
  const providerPort = Number(process.env.PROVIDER_PORT || 4174);
  createServer({ providerPort }).listen(port, '127.0.0.1', () =>
    console.log(`When Working JavaScript Breaks: http://127.0.0.1:${port}`),
  );
  createProviderServer({ appOrigin: `http://127.0.0.1:${port}` }).listen(
    providerPort,
    '127.0.0.1',
    () =>
      console.log(`Fake identity provider: http://127.0.0.1:${providerPort}`),
  );
}
