import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lintFindings } from '../../common/test-helpers.js';
import { findings } from '../../common/semgrep.js';

const folder = `${import.meta.dirname}/..`;

// ESLint flags every read of a closed property. Semgrep flags only the reads
// of the window that window.open() returned.
test('lint flags each read of popup.closed', async () => {
  assert.deepEqual(await lintFindings(folder), [
    'coop.js:29 no-restricted-syntax',
    'coop.js:44 no-restricted-syntax',
    'coop.js:49 no-restricted-syntax',
    'coop.js:50 no-restricted-syntax',
  ]);
});

const semgrep = findings(`${folder}/.semgrep.yml`, folder);
test(
  'Semgrep flags the reads after window.open()',
  { skip: !semgrep && 'Semgrep is not installed' },
  () => {
    assert.deepEqual(semgrep, [
      'coop.js:44 coop-popup-closed',
      'coop.js:49 coop-popup-closed',
      'coop.js:50 coop-popup-closed',
    ]);
  },
);
