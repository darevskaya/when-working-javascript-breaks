import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../server.js';
import { listen, assertHeaders } from '../../common/test-helpers.js';

test('the pages differ only in the widget script and the policy', async (t) => {
  const origin = await listen(createServer(), t);
  const html = async (path) => (await fetch(`${origin}${path}`)).text();
  const policy = await html('/demo/trusted-types/named-policy');
  assert.equal(policy, await html('/demo/trusted-types/policy-not-allowed'));
  // The pages differ only in the scripts at the end of <head>.
  const withoutScripts = (page) =>
    page.replace(/<!-- Only this script differs[\s\S]*?<\/head>/, '</head>');
  assert.equal(
    withoutScripts(await html('/demo/trusted-types/escaped-string')),
    withoutScripts(policy),
  );
  const csp = 'content-security-policy';
  const trustedTypes = "require-trusted-types-for 'script'";
  await assertHeaders(origin, {
    '/': {},
    '/demo/trusted-types/escaped-string': { [csp]: trustedTypes },
    '/demo/trusted-types/named-policy': { [csp]: trustedTypes },
    '/demo/trusted-types/policy-not-allowed': {
      [csp]: `${trustedTypes}; trusted-types shop-policy`,
    },
    '/innerhtml-escaped.js': {},
    '/innerhtml-policy.js': {},
    '/trusted-html.js': {},
    '/orbit.css': {},
  });
  // innerhtml-string.js is only the original. The server does not serve it.
  assert.equal((await fetch(`${origin}/innerhtml-string.js`)).status, 404);
});
