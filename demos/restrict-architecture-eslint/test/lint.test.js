import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ESLint } from 'eslint';
import { lintFindings } from '../../common/test-helpers.js';

const folder = `${import.meta.dirname}/..`;
const eslint = new ESLint({ cwd: folder });
const messages = async (code, filePath) =>
  (await eslint.lintText(code, { filePath }))[0].messages.map(
    (message) => message.message,
  );

test('the demo has no lint finding', async () => {
  assert.deepEqual(await lintFindings(folder), []);
});

test('only worker-factory.js can create a worker or its URL', async () => {
  const create = "new Worker(new URL('./tasks.worker.js', import.meta.url));";
  assert.deepEqual(await messages(create, 'app.js'), [
    'Create workers through worker-factory.js.',
    'Create worker URLs in worker-factory.js.',
  ]);
  assert.deepEqual(await messages(create, 'tasks.worker.js'), [
    'Create workers through worker-factory.js.',
    'Create worker URLs in worker-factory.js.',
  ]);
  assert.deepEqual(await messages(create, 'worker-factory.js'), []);
});

test('other files may import and call createWorker', async () => {
  assert.deepEqual(
    await messages(
      "import { createWorker } from './worker-factory.js'; createWorker();",
      'app.js',
    ),
    [],
  );
});
