import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../server.js';
import { listen, assertHeaders } from '../../common/test-helpers.js';

test('the pages differ only in permission for Blob workers', async (t) => {
  const origin = await listen(createServer(), t);
  const html = async (path) => (await fetch(`${origin}${path}`)).text();
  const page = await html('/demo/worker-src-blob/blob-allowed');
  assert.equal(page, await html('/demo/worker-src-blob/blob-blocked'));
  assert.equal(page, await html('/demo/worker-src-blob/module-worker'));
  const csp = 'content-security-policy';
  await assertHeaders(origin, {
    '/': {},
    '/demo/worker-src-blob/blob-allowed': { [csp]: "worker-src 'self' blob:" },
    '/demo/worker-src-blob/blob-blocked': { [csp]: "worker-src 'self'" },
    '/demo/worker-src-blob/module-worker': { [csp]: "worker-src 'self'" },
    '/worker-page.js': {},
    '/blob-worker-source.js': {},
    '/worker-factory.js': {},
    '/module-worker.js': {},
  });
});
