import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../server.js';
import {
  listen,
  assertHeaders,
  lintFindings,
} from '../../common/test-helpers.js';

test('the profile page sends no policy', async (t) => {
  const origin = await listen(createServer(), t);
  await assertHeaders(origin, {
    '/': {},
    '/demo/connect-src': {},
    '/api-call.js': {},
  });
});

test('lint flags the API host in the page script', async () => {
  assert.deepEqual(await lintFindings(`${import.meta.dirname}/..`), [
    'api-call.js:3 no-restricted-syntax',
  ]);
});
