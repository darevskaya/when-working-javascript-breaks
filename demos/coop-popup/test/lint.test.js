import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lintFindings } from '../../common/test-helpers.js';
import { findings } from '../../common/semgrep.js';

const folder = `${import.meta.dirname}/..`;

// The app reads popup.closed, and the login reads window.opener. ESLint flags
// every read of a closed property. Semgrep flags only the reads of the window
// that window.open() returned.
test('lint flags each read of popup.closed and window.opener', async () => {
  assert.deepEqual(await lintFindings(folder), [
    'orbit-login.js:11 no-restricted-syntax',
    'orbit-login.js:16 no-restricted-syntax',
    'orbit-login.js:22 no-restricted-syntax',
    'orbit-login.js:9 no-restricted-syntax',
    'popup-login.js:31 no-restricted-syntax',
    'popup-login.js:46 no-restricted-syntax',
    'popup-login.js:51 no-restricted-syntax',
    'popup-login.js:52 no-restricted-syntax',
  ]);
});

const semgrep = findings(`${folder}/.semgrep.yml`, folder);
test(
  'Semgrep flags the reads after window.open(), and every window.opener',
  { skip: !semgrep && 'Semgrep is not installed' },
  () => {
    assert.deepEqual(semgrep, [
      'orbit-login.js:11 coop-window-opener',
      'orbit-login.js:16 coop-window-opener',
      'orbit-login.js:22 coop-window-opener',
      'orbit-login.js:9 coop-window-opener',
      'popup-login.js:46 coop-popup-closed',
      'popup-login.js:51 coop-popup-closed',
      'popup-login.js:52 coop-popup-closed',
    ]);
  },
);
