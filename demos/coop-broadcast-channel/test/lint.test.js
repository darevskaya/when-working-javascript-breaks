import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lintFindings } from '../../common/test-helpers.js';
import { findings } from '../../common/semgrep.js';

const folder = `${import.meta.dirname}/..`;

// The same rules as the COOP demo. This login reads neither popup.closed nor
// window.opener, so both tools find nothing.
test('lint finds no window relationship', async () => {
  assert.deepEqual(await lintFindings(folder), []);
});

const semgrep = findings(`${folder}/.semgrep.yml`, folder);
test(
  'Semgrep finds none either',
  { skip: !semgrep && 'Semgrep is not installed' },
  () => {
    assert.deepEqual(semgrep, []);
  },
);
