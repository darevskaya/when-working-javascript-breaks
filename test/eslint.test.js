import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ESLint } from 'eslint';

// npm run lint is meant to fail. These two lines are the demo payload, and the
// linter finds both of them without an exception list.
test('lint flags the calculator Function and the fractal Blob worker', async () => {
  const results = await new ESLint().lintFiles([
    'demos/calculator/calculate.js',
    'public/fractal.js',
  ]);
  const found = results.flatMap((result) =>
    result.messages.map((message) => message.ruleId),
  );
  assert.deepEqual(found.sort(), ['no-new-func', 'no-restricted-syntax']);
});
