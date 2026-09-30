import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lintFindings } from '../../common/test-helpers.js';

const folder = `${import.meta.dirname}/..`;

test('lint flags each read of popup.closed and window.opener', async () => {
  assert.deepEqual(await lintFindings(folder), [
    'login-callback.js no-restricted-syntax',
    'popup-login.js no-restricted-syntax',
  ]);
});
