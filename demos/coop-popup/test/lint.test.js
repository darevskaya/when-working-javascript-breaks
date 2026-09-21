import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lintFindings } from '../../common/test-helpers.js';

const folder = `${import.meta.dirname}/..`;

test('lint flags each read of popup.closed and window.opener', async () => {
  assert.deepEqual(await lintFindings(folder), [
    'orbit-login.js:14 no-restricted-syntax',
    'orbit-login.js:6 no-restricted-syntax',
    'orbit-login.js:8 no-restricted-syntax',
    'popup-login.js:29 no-restricted-syntax',
    'popup-login.js:44 no-restricted-syntax',
    'popup-login.js:47 no-restricted-syntax',
    'popup-login.js:48 no-restricted-syntax',
  ]);
});
