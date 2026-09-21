import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../server.js';
import { listen, assertHeaders } from '../../common/test-helpers.js';

test('one page on three routes, and the route picks the script', async (t) => {
  const origin = await listen(createServer(), t);
  const page = async (route) => (await fetch(`${origin}${route}`)).text();
  const permissive = await page('/demo/script-src-eval/unsafe-eval-allowed');
  assert.equal(permissive, await page('/demo/script-src-eval/eval-blocked'));
  assert.equal(
    permissive,
    await page('/demo/script-src-eval/bundle/eval-source-map'),
  );
  assert.match(permissive, /<script type="module" src="app\.js"><\/script>/);

  const source = await page('/demo/script-src-eval/app.js');
  const bundle = await page('/demo/script-src-eval/bundle/app.js');
  assert.match(source, /renderer\.js/);
  assert.match(bundle, /\beval\(/);

  const csp = 'content-security-policy';
  await assertHeaders(origin, {
    '/': {},
    '/demo/script-src-eval/unsafe-eval-allowed': {
      [csp]: "script-src 'self' 'unsafe-eval'",
    },
    '/demo/script-src-eval/eval-blocked': { [csp]: "script-src 'self'" },
    '/demo/script-src-eval/bundle/eval-source-map': {
      [csp]: "script-src 'self'",
    },
    '/demo/script-src-eval/app.js': {},
    '/demo/script-src-eval/renderer.js': {},
    '/demo/script-src-eval/bundle/app.js': {},
    '/styles.css': {},
    '/app.css': {},
  });
  for (const route of ['/demo/script-src-eval/unknown', '/server.js']) {
    assert.equal((await fetch(`${origin}${route}`)).status, 404);
  }
});
