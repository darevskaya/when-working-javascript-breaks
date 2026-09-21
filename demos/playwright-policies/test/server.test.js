import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../server.js';
import { listen, assertHeaders } from '../../common/test-helpers.js';

test('both routes serve the same page, and the headers differ', async (t) => {
  const origin = await listen(createServer(), t);
  const page = async (route) => (await fetch(`${origin}${route}`)).text();
  const allowed = await page('/demo/playwright-policies/allowed');
  assert.equal(allowed, await page('/demo/playwright-policies/blocked'));
  assert.match(allowed, /<script type="module" src="\/app\.js"><\/script>/);

  await assertHeaders(origin, {
    '/': {},
    '/demo/playwright-policies/allowed': {
      'content-security-policy': "script-src 'self'; worker-src 'self' blob:",
    },
    '/demo/playwright-policies/blocked': {
      'content-security-policy': "script-src 'self'",
      'permissions-policy': 'geolocation=()',
    },
    '/app.js': {},
    '/app.css': {},
    '/styles.css': {},
  });
  for (const route of ['/demo/playwright-policies/unknown', '/server.js']) {
    assert.equal((await fetch(`${origin}${route}`)).status, 404);
  }
});
