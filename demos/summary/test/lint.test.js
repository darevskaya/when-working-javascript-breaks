import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lintFindings } from '../../common/test-helpers.js';
import { findings } from '../../common/semgrep.js';

const folder = `${import.meta.dirname}/..`;

test('lint flags the eval in the template renderer', async () => {
  assert.deepEqual(await lintFindings(folder), ['template.js:10 no-eval']);
});

const semgrep = findings(`${folder}/.semgrep.yml`, folder);
test(
  'Semgrep flags the same line',
  { skip: !semgrep && 'Semgrep is not installed' },
  () => {
    assert.deepEqual(semgrep, ['template.js:10 script-src-string-to-code']);
  },
);
