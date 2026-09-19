import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../server.js';
import { listen, assertHeaders } from '../../common/test-helpers.js';

test('the two pages differ only in unsafe-eval', async (t) => {
  const origin = await listen(createServer(), t);
  const permissive = await fetch(`${origin}/demo/summary/permissive`);
  const restricted = await fetch(`${origin}/demo/summary/restricted`);
  assert.equal(await permissive.text(), await restricted.text());
  const csp = 'content-security-policy';
  await assertHeaders(origin, {
    '/': {},
    '/demo/summary/permissive': { [csp]: "script-src 'self' 'unsafe-eval'" },
    '/demo/summary/restricted': { [csp]: "script-src 'self'" },
    '/summary.js': {},
    '/template.js': {},
    '/styles.css': {},
  });
  for (const path of ['/demo/summary/unknown', '/server.js']) {
    assert.equal((await fetch(`${origin}${path}`)).status, 404);
  }
});
