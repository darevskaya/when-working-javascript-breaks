import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lintFindings } from '../../common/test-helpers.js';

const folder = `${import.meta.dirname}/..`;

// The renderer calls eval. The webpack configuration adds eval to the
// bundle, so lint checks the build configuration too.
test('lint flags the eval and the eval devtool', async () => {
  assert.deepEqual(await lintFindings(folder), [
    'eval-renderer.js:10 no-eval',
    'webpack.config.js:18 no-restricted-syntax',
  ]);
});
