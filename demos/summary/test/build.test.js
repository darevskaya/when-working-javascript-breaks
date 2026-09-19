import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import webpack from 'webpack';
import config from '../webpack.config.js';

const folder = path.join(import.meta.dirname, '..');

// npm test runs npm run build first.
test('the eval-source-map bundle contains eval, and its source does not', async () => {
  const bundle = await readFile(path.join(folder, 'dist/summary.js'), 'utf8');
  assert.match(bundle, /\beval\(/);
  assert.doesNotMatch(bundle, /String\(eval\(/);
  const source = await readFile(path.join(folder, 'template-safe.js'), 'utf8');
  // The comments explain eval. The code does not call it.
  assert.doesNotMatch(source.replace(/\/\/.*$/gm, ''), /\beval\(/);
});

// The configuration that webpack.config.js holds in a comment.
test('with devtool source-map, the bundle has no eval', async (t) => {
  const output = await mkdtemp(path.join(tmpdir(), 'summary-build-'));
  t.after(() => rm(output, { recursive: true, force: true }));
  const stats = await new Promise((resolve, reject) =>
    webpack(
      {
        ...config,
        devtool: 'source-map',
        output: { ...config.output, path: output },
      },
      (error, result) => (error ? reject(error) : resolve(result)),
    ),
  );
  assert.equal(stats.hasErrors(), false);
  const bundle = await readFile(path.join(output, 'summary.js'), 'utf8');
  assert.doesNotMatch(bundle, /\beval\(/);
  assert.match(bundle, /sourceMappingURL=summary\.js\.map/);
});
