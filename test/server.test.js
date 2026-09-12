import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../server.js';

test('one calculator document, route-based policies, and isolated build variants', async (t) => {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const permissive = await fetch(
    `${origin}/demo/calculator/permissive?example=webpack&version=original`,
  );
  const restricted = await fetch(
    `${origin}/demo/calculator/restricted?example=function&version=fixed&policy=permissive`,
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

  for (const build of ['eval', 'fixed']) {
    const response = await fetch(`${origin}/bundles/${build}/dialog.js`);
    assert.equal(response.status, 200);
    const source = await response.text();
    if (build === 'eval') assert.match(source, /\beval\(/);
    else assert.doesNotMatch(source, /\beval\(/);
    assert.match(source, /new Function\(/);
  }
  for (const asset of ['/calculator.js', '/calculator.css', '/styles.css']) {
    assert.equal((await fetch(`${origin}${asset}`)).status, 200);
  }
  for (const route of [
    '/demo/calculator/unknown',
    '/demo/unknown/permissive',
    '/demo/__proto__/permissive',
    '/server.js',
  ]) {
    assert.equal((await fetch(`${origin}${route}`)).status, 404);
  }
  const redirects = [
    ['/', '/demo/calculator/permissive?example=webpack&version=original'],
    [
      '/demo/eval/restricted?build=fixed',
      '/demo/calculator/restricted?example=webpack&version=fixed',
    ],
    [
      '/demo/function/permissive?implementation=dynamic',
      '/demo/calculator/permissive?example=function&version=original',
    ],
    [
      '/demo/function/restricted?implementation=plain',
      '/demo/calculator/restricted?example=function&version=fixed',
    ],
  ];
  for (const [from, to] of redirects) {
    const response = await fetch(`${origin}${from}`, { redirect: 'manual' });
    assert.equal(response.status, 302);
    assert.equal(response.headers.get('location'), to);
  }
});
