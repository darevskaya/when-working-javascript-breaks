import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from '../server.js';

test('same account document and bundle, different enforced response policies', async (t) => {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const baseline = await fetch(`${origin}/demo/eval/permissive`);
  const strict = await fetch(`${origin}/demo/eval/restricted`);
  assert.match(
    baseline.headers.get('content-security-policy'),
    /'unsafe-eval'/,
  );
  assert.doesNotMatch(
    strict.headers.get('content-security-policy'),
    /'unsafe-eval'/,
  );
  assert.equal(baseline.status, 200);
  assert.equal(strict.status, 200);
  const html = await baseline.text();
  assert.equal(html, await strict.text());
  assert.doesNotMatch(html, /<iframe/i);
  assert.equal(
    baseline.headers
      .get('content-security-policy')
      .replace(" 'unsafe-eval'", ''),
    strict.headers.get('content-security-policy'),
  );
  const home = await fetch(origin, { redirect: 'manual' });
  assert.equal(home.status, 302);
  assert.equal(
    home.headers.get('location'),
    '/demo/eval/permissive?build=eval',
  );
  assert.equal((await fetch(`${origin}/demo/eval/unknown`)).status, 404);
  const broken = await fetch(`${origin}/bundles/eval/dialog.js`);
  assert.equal(broken.status, 200);
  assert.match(await broken.text(), /eval\(/);
  const fixed = await fetch(`${origin}/bundles/fixed/dialog.js`);
  assert.equal(fixed.status, 200);
  assert.doesNotMatch(await fixed.text(), /eval\(/);
  assert.equal((await fetch(`${origin}/server.js`)).status, 404);
  assert.equal(
    (
      await fetch(`${origin}/demo/eval/restricted?policy=baseline&build=fixed`)
    ).headers.get('content-security-policy'),
    strict.headers.get('content-security-policy'),
  );
});

test('feature source has no string-to-code API', async () => {
  const source = await readFile(
    new URL('../demos/eval/dialog.js', import.meta.url),
    'utf8',
  );
  assert.doesNotMatch(source, /\beval\s*\(|new\s+Function\s*\(/);
});
