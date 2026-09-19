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

test('both markup rules flag the widget, and neither flags the fixed widget', async () => {
  const [widget, fixed] = await new ESLint().lintFiles([
    'demos/sdk/sdk.js',
    'demos/sdk/sdk-safe.js',
  ]);
  assert.deepEqual(
    widget.messages.map((message) => `${message.line} ${message.ruleId}`),
    [
      '8 no-unsanitized/property',
      '8 no-restricted-syntax',
      '21 no-unsanitized/property',
      '21 no-restricted-syntax',
    ],
  );
  assert.deepEqual(fixed.messages, []);
});

// Trusted Types blocks every string in these sinks. no-unsanitized looks for
// XSS, so it allows constant strings. The innerHTML rule sees only innerHTML.
test('each markup rule sees sinks that the other one misses', async () => {
  const eslint = new ESLint();
  const cases = {
    'el.innerHTML = `<h2>${shop}</h2>`;': [
      'no-restricted-syntax',
      'no-unsanitized/property',
    ],
    "el.innerHTML = '<b>Orbit ID</b>';": ['no-restricted-syntax'],
    "el['innerHTML'] = markup;": ['no-restricted-syntax'],
    'el.outerHTML = markup;': ['no-unsanitized/property'],
    "el.insertAdjacentHTML('beforeend', markup);": ['no-unsanitized/method'],
    'document.write(markup);': ['no-unsanitized/method'],
  };
  for (const [code, expected] of Object.entries(cases)) {
    const [result] = await eslint.lintText(code, {
      filePath: 'demos/sdk/example.js',
    });
    assert.deepEqual(
      result.messages.map((message) => message.ruleId).sort(),
      expected,
      code,
    );
  }
});
