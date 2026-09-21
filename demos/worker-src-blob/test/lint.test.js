import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ESLint } from 'eslint';
import { lintFindings } from '../../common/test-helpers.js';

const folder = `${import.meta.dirname}/..`;

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
  const [outside] = await eslint.lintText(code, { filePath: 'worker-page.js' });
  const [inside] = await eslint.lintText(code, {
    filePath: 'worker-factory.js',
  });
  assert.deepEqual(
    outside.messages.map((message) => message.message),
    ['Start a Worker through workerFactory() in worker-factory.js.'],
  );
  assert.deepEqual(inside.messages, []);
});
