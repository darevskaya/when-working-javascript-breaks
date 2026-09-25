import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ESLint } from 'eslint';
import { lintFindings } from '../../common/test-helpers.js';

const folder = `${import.meta.dirname}/..`;

test('the demo has no lint finding', async () => {
  assert.deepEqual(await lintFindings(folder), []);
});

const eslint = new ESLint({ cwd: folder });
const messages = async (code, filePath) =>
  (await eslint.lintText(code, { filePath }))[0].messages.map(
    (message) => message.message,
  );

test('page code starts no worker and names no script', async () => {
  assert.deepEqual(
    await messages("new Worker('/tasks.worker.js');", 'app.js'),
    [
      'Start the worker through worker-client.js.',
      'Put the worker script in config.js.',
    ],
  );
  assert.deepEqual(await messages('new window.Worker(url);', 'app.js'), [
    'Start the worker through worker-client.js.',
  ]);
  assert.deepEqual(await messages('total([1]);', 'app.js'), []);
});

test('the worker client may start a worker, and may not name a script', async () => {
  assert.deepEqual(
    await messages('new Worker(config.workerScript);', 'worker-client.js'),
    [],
  );
  assert.deepEqual(
    await messages("new Worker('/other.worker.js');", 'worker-client.js'),
    ['Put the worker script in config.js.'],
  );
  assert.deepEqual(
    await messages('new Worker(`${base}/other.js`);', 'worker-client.js'),
    ['Put the worker script in config.js.'],
  );
});

test('no file builds a worker from a Blob URL', async () => {
  const blob =
    "const url = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));";
  for (const file of ['app.js', 'worker-client.js', 'config.js']) {
    assert.deepEqual(await messages(blob, file), [
      'Start a Worker from a script path, not a Blob URL.',
      'Start a Worker from a script path, not a Blob URL.',
    ]);
  }
});

test('the configuration may name an allowed script, and may start no worker', async () => {
  assert.deepEqual(
    await messages(
      "export const config = { workerScript: '/tasks.worker.js' };",
      'config.js',
    ),
    [],
  );
  assert.deepEqual(
    await messages(
      "export const config = { workerScript: '/vendor.worker.js' };",
      'config.js',
    ),
    ['Name only an allowed worker script: /tasks.worker.js.'],
  );
  assert.deepEqual(
    await messages(
      'export const config = { workerScript: `/vendor.worker.js` };',
      'config.js',
    ),
    ['Name only an allowed worker script: /tasks.worker.js.'],
  );
  assert.deepEqual(
    await messages("new Worker('/tasks.worker.js');", 'config.js'),
    ['Start the worker through worker-client.js.'],
  );
});

test('an import of a module is not a worker script', async () => {
  assert.deepEqual(
    await messages("import { config } from './config.js';", 'app.js'),
    [],
  );
  assert.deepEqual(
    await messages("import { config } from './config.js';", 'worker-client.js'),
    [],
  );
});
