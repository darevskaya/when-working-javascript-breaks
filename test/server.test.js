import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from '../server.js';

test('same account document and bundle, different enforced response policies', async (t) => {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const baseline = await fetch(`${origin}/demo/eval?policy=baseline`);
  const strict = await fetch(`${origin}/demo/eval?policy=restricted`);
  assert.match(
    baseline.headers.get('content-security-policy'),
    /'unsafe-eval'/,
  );
  assert.doesNotMatch(
    strict.headers.get('content-security-policy'),
    /'unsafe-eval'/,
  );
  assert.equal(await baseline.text(), await strict.text());
  const broken = await fetch(`${origin}/bundles/eval/dialog.js`);
  assert.equal(broken.status, 200);
  assert.match(await broken.text(), /eval\(/);
  const fixed = await fetch(`${origin}/bundles/fixed/dialog.js`);
  assert.equal(fixed.status, 200);
  assert.doesNotMatch(await fixed.text(), /eval\(/);
  assert.equal((await fetch(`${origin}/server.js`)).status, 404);
  assert.equal(
    (await fetch(`${origin}/demo/eval?policy=unknown`)).headers.get(
      'content-security-policy',
    ),
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
