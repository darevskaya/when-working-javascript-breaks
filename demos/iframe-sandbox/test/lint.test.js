import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lintFindings } from '../../common/test-helpers.js';

const folder = `${import.meta.dirname}/..`;

test('lint flags the redirect of the whole page', async () => {
  assert.deepEqual(await lintFindings(folder), [
    'redirect-frame.js:20 no-restricted-syntax',
  ]);
});
