import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lintFindings } from '../../common/test-helpers.js';

const folder = `${import.meta.dirname}/..`;

// The app reads popup.closed, and the login reads window.opener. ESLint flags
// every read of a closed property.
test('lint flags each read of popup.closed and window.opener', async () => {
  assert.deepEqual(await lintFindings(folder), [
    'orbit-login.js:10 no-restricted-syntax',
    'orbit-login.js:17 no-restricted-syntax',
    'orbit-login.js:8 no-restricted-syntax',
    'popup-login.js:31 no-restricted-syntax',
    'popup-login.js:46 no-restricted-syntax',
    'popup-login.js:51 no-restricted-syntax',
    'popup-login.js:52 no-restricted-syntax',
  ]);
});
