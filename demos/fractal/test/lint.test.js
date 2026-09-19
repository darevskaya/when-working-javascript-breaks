import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { ESLint } from 'eslint';
import { lintFindings } from '../../common/test-helpers.js';
import { findings } from '../../common/semgrep.js';

const folder = `${import.meta.dirname}/..`;
const config = `${folder}/.semgrep.yml`;

// The page starts its worker through the factory, so only the factory holds
// the Blob worker.
test('lint flags the Blob worker in the factory', async () => {
  assert.deepEqual(await lintFindings(folder), [
    'worker-factory.js:10 no-restricted-syntax',
  ]);
});

test('lint allows new Worker only in the worker factory', async () => {
  const eslint = new ESLint({ cwd: folder });
  const code = "new Worker('/worker.js');";
  const [outside] = await eslint.lintText(code, { filePath: 'fractal.js' });
  const [inside] = await eslint.lintText(code, {
    filePath: 'worker-factory.js',
  });
  assert.deepEqual(
    outside.messages.map((message) => message.message),
    ['Start a Worker through workerFactory() in worker-factory.js.'],
  );
  assert.deepEqual(inside.messages, []);
});

const semgrep = findings(config, folder);
const skip = !semgrep && 'Semgrep is not installed';

test('Semgrep flags the same line', { skip }, () => {
  assert.deepEqual(semgrep, ['worker-factory.js:10 worker-src-blob-worker']);
});

// ESLint flags every Worker path that is not a literal. The Semgrep taint
// rule follows the value, so it flags only a Blob URL.
test(
  'the Semgrep rule follows the Blob URL through variables',
  { skip },
  () => {
    const file = path.join(
      mkdtempSync(path.join(tmpdir(), 'semgrep-')),
      'w.js',
    );
    writeFileSync(
      file,
      [
        'const url = URL.createObjectURL(blob);',
        'const workerUrl = url;',
        'new Worker(workerUrl);',
        'new Worker(config.path);',
        '',
      ].join('\n'),
    );
    assert.deepEqual(findings(config, file), ['w.js:3 worker-src-blob-worker']);
  },
);
