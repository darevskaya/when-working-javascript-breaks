import assert from 'node:assert/strict';
import path from 'node:path';
import { ESLint } from 'eslint';

// Starts a server on a free port for one test, and stops it after the test.
export async function listen(server, t) {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  return `http://127.0.0.1:${server.address().port}`;
}

// Headers every HTTP response may carry. A route sends its policy headers on
// top of these, or none at all.
const ordinary = new Set([
  'content-type',
  'content-length',
  'date',
  'connection',
  'keep-alive',
  'location',
  'transfer-encoding',
]);

// Makes sure that each route sends exactly the headers it lists, and no other
// header apart from the ordinary ones.
export async function assertHeaders(origin, routes) {
  for (const [path, headers] of Object.entries(routes)) {
    const response = await fetch(`${origin}${path}`, { redirect: 'manual' });
    await response.arrayBuffer();
    for (const [name, value] of Object.entries(headers)) {
      assert.equal(response.headers.get(name), value, path);
    }
    for (const name of response.headers.keys()) {
      assert.ok(
        ordinary.has(name) || name in headers,
        `${path}: unexpected ${name}`,
      );
    }
  }
}

// Collects securitypolicyviolation events into window.cspViolations. Run it
// in a Playwright test before the page loads.
export function recordViolations(page) {
  return page.addInitScript(() => {
    window.cspViolations = [];
    document.addEventListener('securitypolicyviolation', (event) => {
      window.cspViolations.push({
        directive: event.effectiveDirective,
        blocked: event.blockedURI,
      });
    });
  });
}

// The lint errors in one demo folder, as "file:line rule" strings, sorted.
// The default is that folder's eslint.config.js over the whole folder. A demo
// that keeps one lint per concern passes its own config file and paths.
export async function lintFindings(folder, { config, files = ['.'] } = {}) {
  const eslint = new ESLint({
    cwd: folder,
    ...(config ? { overrideConfigFile: path.resolve(folder, config) } : {}),
  });
  const results = await eslint.lintFiles(files);
  return results
    .flatMap((result) =>
      result.messages.map(
        (message) =>
          `${path.basename(result.filePath)}:${message.line} ${message.ruleId}`,
      ),
    )
    .sort();
}
