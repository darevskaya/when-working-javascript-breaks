import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../server.js';
import { listen, assertHeaders } from '../../common/test-helpers.js';

const routes = ['no-header', 'string', 'policy', 'dom'];

test('every route serves the same page, and the header differs', async (t) => {
  const origin = await listen(createServer(), t);
  const page = async (route) =>
    (await fetch(`${origin}/demo/restrict-inner-html/${route}`)).text();

  const first = await page(routes[0]);
  for (const route of routes.slice(1)) {
    assert.equal(await page(route), first, route);
  }
  assert.match(first, /<script type="module" src="\/app\.js"><\/script>/);

  const csp = 'content-security-policy';
  const none = "require-trusted-types-for 'script'; trusted-types 'none'";
  const one = "require-trusted-types-for 'script'; trusted-types dompurify";
  await assertHeaders(origin, {
    '/': {},
    '/demo/restrict-inner-html/no-header': {},
    '/demo/restrict-inner-html/string': { [csp]: none },
    '/demo/restrict-inner-html/policy': { [csp]: one },
    '/demo/restrict-inner-html/dom': { [csp]: none },
    '/app.js': {},
    '/render-with-string.js': {},
    '/render-with-policy.js': {},
    '/render-with-dom.js': {},
    '/app.css': {},
    '/styles.css': {},
  });
  const bare = await fetch(`${origin}/demo/restrict-inner-html/no-header`);
  await bare.arrayBuffer();
  assert.equal(bare.headers.get(csp), null);

  for (const route of ['/demo/restrict-inner-html/unknown', '/server.js']) {
    assert.equal((await fetch(`${origin}${route}`)).status, 404);
  }
});
