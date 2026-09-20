import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../server.js';
import { listen, assertHeaders } from '../../common/test-helpers.js';

test('the pages differ only in the scripts and the policy list', async (t) => {
  const origin = await listen(createServer(), t);
  const html = async (path) => (await fetch(`${origin}${path}`)).text();
  // The pages differ only in the scripts at the end of <head>.
  const withoutScripts = (page) =>
    page.replace(/<!-- Only these scripts differ[\s\S]*?<\/head>/, '</head>');
  assert.equal(
    withoutScripts(await html('/demo/trusted-types/no-policy')),
    withoutScripts(await html('/demo/trusted-types/one-policy')),
  );
  const csp = 'content-security-policy';
  const trustedTypes = "require-trusted-types-for 'script'";
  await assertHeaders(origin, {
    '/': {},
    '/demo/trusted-types/no-policy': {
      [csp]: `${trustedTypes}; trusted-types 'none'`,
    },
    '/demo/trusted-types/one-policy': {
      [csp]: `${trustedTypes}; trusted-types orbit-widget`,
    },
    '/dom-widget.js': {},
    '/policy-widget.js': {},
    '/policy-probe.js': {},
    '/trusted-html.js': {},
    '/orbit.css': {},
  });
  // string-widget.js is only the original. The server does not serve it.
  assert.equal((await fetch(`${origin}/string-widget.js`)).status, 404);
});
