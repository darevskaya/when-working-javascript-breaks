import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../server.js';
import { listen, assertHeaders } from '../../common/test-helpers.js';

test('the pages differ only in unsafe-eval and the script', async (t) => {
  const origin = await listen(createServer(), t);
  const permissive = await fetch(`${origin}/demo/summary/permissive`);
  const restricted = await fetch(`${origin}/demo/summary/restricted`);
  const page = await permissive.text();
  assert.equal(page, await restricted.text());
  const bundle = await (await fetch(`${origin}/demo/summary/bundle`)).text();
  assert.equal(
    bundle
      .replace(/\n *<!-- The same page as summary\.html[^>]*-->/, '')
      .replace(
        '<script src="/bundle/summary.js" defer></script>',
        '<script type="module" src="/summary.js"></script>',
      ),
    page,
  );
  const csp = 'content-security-policy';
  await assertHeaders(origin, {
    '/': {},
    '/demo/summary/permissive': { [csp]: "script-src 'self' 'unsafe-eval'" },
    '/demo/summary/restricted': { [csp]: "script-src 'self'" },
    '/demo/summary/bundle': { [csp]: "script-src 'self'" },
    '/bundle/summary.js': {},
    '/summary.js': {},
    '/template.js': {},
    '/styles.css': {},
  });
  for (const path of ['/demo/summary/unknown', '/server.js']) {
    assert.equal((await fetch(`${origin}${path}`)).status, 404);
  }
});
