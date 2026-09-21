import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ESLint } from 'eslint';
import { lintFindings } from '../../common/test-helpers.js';

const folder = `${import.meta.dirname}/..`;

// app.js starts its Worker from a Blob URL on purpose, so lint fails here.
test('lint flags the Blob worker in app.js', async () => {
  assert.deepEqual(await lintFindings(folder), [
    'app.js:69 no-restricted-syntax',
  ]);
});

test('lint allows a Worker that starts from a script path', async () => {
  const eslint = new ESLint({ cwd: folder });
  const messages = async (code) =>
    (await eslint.lintText(code, { filePath: 'feature.js' }))[0].messages.map(
      (message) => message.message,
    );
  assert.deepEqual(await messages("new Worker('/worker.js');"), []);
  assert.deepEqual(await messages('new Worker(new URL(path, base));'), []);
  assert.deepEqual(await messages('new Worker(blobUrl);'), [
    'Start a Worker from a script path, not a Blob URL.',
  ]);
});
