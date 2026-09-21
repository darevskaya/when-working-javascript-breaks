import assert from 'node:assert/strict';
import path from 'node:path';
import { ESLint } from 'eslint';

export async function listen(server, t) {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  return `http://127.0.0.1:${server.address().port}`;
}

// Non-policy headers allowed on every response.
const ordinary = new Set([
  'content-type',
  'content-length',
  'date',
  'connection',
  'keep-alive',
  'location',
  'transfer-encoding',
]);

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

// Call before navigation to capture CSP violations.
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
