import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ESLint } from 'eslint';

// npm run lint is meant to fail. These two lines are the demo payload, and the
// linter finds both of them without an exception list. The fractal page starts
// its worker through the factory, so only the factory holds the Blob worker.
test('lint flags the calculator Function and the fractal Blob worker', async () => {
  const results = await new ESLint().lintFiles([
    'demos/calculator/calculate.js',
    'demos/fractal/fractal.js',
    'demos/fractal/worker-factory.js',
  ]);
  const found = results.flatMap((result) =>
    result.messages.map((message) => message.ruleId),
  );
  assert.deepEqual(found.sort(), ['no-new-func', 'no-restricted-syntax']);
});

test('lint allows new Worker only in the worker factory', async () => {
  const eslint = new ESLint();
  const [outside] = await eslint.lintText("new Worker('/worker.js');", {
    filePath: 'demos/fractal/fractal.js',
  });
  const [inside] = await eslint.lintText("new Worker('/worker.js');", {
    filePath: 'demos/fractal/worker-factory.js',
  });
  assert.deepEqual(
    outside.messages.map((message) => message.message),
    ['Start a Worker through workerFactory() in worker-factory.js.'],
  );
  assert.deepEqual(inside.messages, []);
});
