import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lintFindings } from '../../common/test-helpers.js';

const folder = `${import.meta.dirname}/..`;

test('lint flags each read of popup.closed and window.opener', async () => {
  assert.deepEqual(await lintFindings(folder), [
    'orbit-login.js:7 no-restricted-syntax',
    'popup-login.js:29 no-restricted-syntax',
    'popup-login.js:45 no-restricted-syntax',
  ]);
});
