import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../server.js';

test('one calculator document, route-based policies, and one dialog bundle', async (t) => {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const permissive = await fetch(`${origin}/demo/calculator/permissive`);
  const restricted = await fetch(
    `${origin}/demo/calculator/restricted?policy=permissive`,
  );
  assert.equal(permissive.status, 200);
  assert.equal(restricted.status, 200);
  const policy = permissive.headers.get('content-security-policy');
  assert.match(policy, /'unsafe-eval'/);
  assert.equal(
    policy.replace(" 'unsafe-eval'", ''),
    restricted.headers.get('content-security-policy'),
  );
  const html = await permissive.text();
  assert.equal(html, await restricted.text());
  assert.doesNotMatch(html, /<iframe|src="\/bundles\//i);

  const response = await fetch(`${origin}/bundles/dialog.js`);
  assert.equal(response.status, 200);
  const source = await response.text();
  assert.doesNotMatch(source, /\beval\(/);
  assert.match(source, /new Function\(/);
  for (const asset of ['/calculator.js', '/calculator.css', '/styles.css']) {
    assert.equal((await fetch(`${origin}${asset}`)).status, 200);
  }
  for (const route of [
    '/demo/calculator/unknown',
    '/demo/unknown/permissive',
    '/server.js',
  ]) {
    assert.equal((await fetch(`${origin}${route}`)).status, 404);
  }
  const root = await fetch(`${origin}/`, { redirect: 'manual' });
  assert.equal(root.status, 302);
  assert.equal(root.headers.get('location'), '/demo/calculator/permissive');
});
