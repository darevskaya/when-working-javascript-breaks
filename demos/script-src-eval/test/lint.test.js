import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lintFindings } from '../../common/test-helpers.js';

const folder = `${import.meta.dirname}/..`;

test('lint:source flags the eval in the renderer', async () => {
  const findings = await lintFindings(folder, {
    config: 'eslint.source.config.js',
  });
  assert.deepEqual(findings, ['renderer.js no-eval']);
});

test('lint:build flags the eval that the devtool put in the bundle', async () => {
  assert.deepEqual(
    await lintFindings(folder, {
      config: 'eslint.build.config.js',
      files: ['dist'],
    }),
    ['app.js no-eval'],
  );
});

test('lint:webpack flags the devtool that adds the eval', async () => {
  assert.deepEqual(
    await lintFindings(folder, {
      config: 'eslint.webpack.config.js',
      files: ['webpack.config.js'],
    }),
    ['webpack.config.js no-restricted-syntax'],
  );
});

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
