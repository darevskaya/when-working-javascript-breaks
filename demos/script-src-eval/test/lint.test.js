import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lintFindings } from '../../common/test-helpers.js';

const folder = `${import.meta.dirname}/..`;

// Three lints, one concern each. Each one finds exactly one line.
test('lint:source flags the eval in the renderer', async () => {
  assert.deepEqual(
    await lintFindings(folder, { config: 'eslint.source.config.js' }),
    ['renderer.js:6 no-eval'],
  );
});

// npm test runs npm run build first.
test('lint:build flags the eval that the devtool put in the bundle', async () => {
  assert.deepEqual(
    await lintFindings(folder, {
      config: 'eslint.build.config.js',
      files: ['dist'],
    }),
    ['app.js:1 no-eval'],
  );
});

test('lint:webpack flags the devtool that adds the eval', async () => {
  assert.deepEqual(
    await lintFindings(folder, {
      config: 'eslint.webpack.config.js',
      files: ['webpack.config.js'],
    }),
    ['webpack.config.js:10 no-restricted-syntax'],
  );
});

// The source lint reads the page code only, and the build lint reads dist
// only, so neither one reports the other's file.
test('each lint reads its own files', async () => {
  const source = await lintFindings(folder, {
    config: 'eslint.source.config.js',
  });
  assert.ok(!source.some((finding) => finding.startsWith('webpack.config.js')));
  const build = await lintFindings(folder, {
    config: 'eslint.build.config.js',
    files: ['dist'],
  });
  assert.ok(!build.some((finding) => finding.startsWith('renderer.js')));
});
