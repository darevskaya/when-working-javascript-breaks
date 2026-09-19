import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../server.js';
import { listen, assertHeaders } from '../../common/test-helpers.js';

test('the pages differ only in unsafe-eval and the script', async (t) => {
  const origin = await listen(createServer(), t);
  const permissive = await fetch(
    `${origin}/demo/script-src-eval/unsafe-eval-allowed`,
  );
  const restricted = await fetch(`${origin}/demo/script-src-eval/eval-blocked`);
  const page = await permissive.text();
  assert.equal(page, await restricted.text());
  const bundle = await (
    await fetch(`${origin}/demo/script-src-eval/eval-source-map-bundle`)
  ).text();
  assert.equal(
    bundle
      .replace(/\n *<!-- The same page as templates\.html[^>]*-->/, '')
      .replace(
        '<script src="/bundle/templates-page.js" defer></script>',
        '<script type="module" src="/templates-page.js"></script>',
      ),
    page,
  );
  const csp = 'content-security-policy';
  await assertHeaders(origin, {
    '/': {},
    '/demo/script-src-eval/unsafe-eval-allowed': {
      [csp]: "script-src 'self' 'unsafe-eval'",
    },
    '/demo/script-src-eval/eval-blocked': { [csp]: "script-src 'self'" },
    '/demo/script-src-eval/eval-source-map-bundle': {
      [csp]: "script-src 'self'",
    },
    '/bundle/templates-page.js': {},
    '/templates-page.js': {},
    '/eval-renderer.js': {},
    '/styles.css': {},
  });
  for (const path of ['/demo/script-src-eval/unknown', '/server.js']) {
    assert.equal((await fetch(`${origin}${path}`)).status, 404);
  }
});
