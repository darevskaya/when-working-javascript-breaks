import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lintFindings } from '../../common/test-helpers.js';
import { findings } from '../../common/semgrep.js';

const folder = `${import.meta.dirname}/..`;

test('lint flags the redirect of the whole page', async () => {
  assert.deepEqual(await lintFindings(folder), [
    'frame.js:20 no-restricted-syntax',
  ]);
});

const semgrep = findings(`${folder}/.semgrep.yml`, folder);
test(
  'Semgrep flags the same line',
  { skip: !semgrep && 'Semgrep is not installed' },
  () => {
    assert.deepEqual(semgrep, ['frame.js:20 sandbox-top-navigation']);
  },
);
