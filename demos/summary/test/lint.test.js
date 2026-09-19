import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lintFindings } from '../../common/test-helpers.js';
import { findings } from '../../common/semgrep.js';

const folder = `${import.meta.dirname}/..`;

// The renderer calls eval. The webpack configuration adds eval to the
// bundle, so lint checks the build configuration too.
test('lint flags the eval and the eval devtool', async () => {
  assert.deepEqual(await lintFindings(folder), [
    'template.js:10 no-eval',
    'webpack.config.js:18 no-restricted-syntax',
  ]);
});

const semgrep = findings(`${folder}/.semgrep.yml`, folder);
test(
  'Semgrep flags the same lines',
  { skip: !semgrep && 'Semgrep is not installed' },
  () => {
    assert.deepEqual(semgrep, [
      'template.js:10 script-src-string-to-code',
      'webpack.config.js:18 webpack-eval-devtool',
    ]);
  },
);
