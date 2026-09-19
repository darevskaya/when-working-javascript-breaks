import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../server.js';
import { listen, assertHeaders } from '../../common/test-helpers.js';

test('the pages differ only in the widget script and the policy', async (t) => {
  const origin = await listen(createServer(), t);
  const html = async (path) => (await fetch(`${origin}${path}`)).text();
  const policy = await html('/demo/widget/policy');
  assert.equal(policy, await html('/demo/widget/policy-not-allowed'));
  assert.equal(
    (await html('/demo/widget/escaped')).replace(
      '/widget-escaped.js',
      '/widget-policy.js',
    ),
    policy,
  );
  const csp = 'content-security-policy';
  const trustedTypes = "require-trusted-types-for 'script'";
  await assertHeaders(origin, {
    '/': {},
    '/demo/widget/escaped': { [csp]: trustedTypes },
    '/demo/widget/policy': { [csp]: trustedTypes },
    '/demo/widget/policy-not-allowed': {
      [csp]: `${trustedTypes}; trusted-types shop-policy`,
    },
    '/widget-escaped.js': {},
    '/widget-policy.js': {},
    '/shop.css': {},
    '/orbit.css': {},
  });
  // widget.js is only the original. The server does not serve it.
  assert.equal((await fetch(`${origin}/widget.js`)).status, 404);
});
