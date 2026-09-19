import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../server.js';
import { listen, assertHeaders } from '../../common/test-helpers.js';

test('the pages differ only in permission for Blob workers', async (t) => {
  const origin = await listen(createServer(), t);
  const html = async (path) => (await fetch(`${origin}${path}`)).text();
  const page = await html('/demo/fractal/permissive');
  assert.equal(page, await html('/demo/fractal/restricted'));
  assert.equal(page, await html('/demo/fractal/module'));
  const csp = 'content-security-policy';
  await assertHeaders(origin, {
    '/': {},
    '/demo/fractal/permissive': { [csp]: "worker-src 'self' blob:" },
    '/demo/fractal/restricted': { [csp]: "worker-src 'self'" },
    '/demo/fractal/module': { [csp]: "worker-src 'self'" },
    '/fractal.js': {},
    '/fractal-worker.js': {},
    '/worker-factory.js': {},
    '/fractal-module-worker.js': {},
  });
});
