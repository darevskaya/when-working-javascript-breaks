import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ESLint } from 'eslint';
import { lintFindings } from '../../common/test-helpers.js';

const folder = `${import.meta.dirname}/..`;

// The API list breaks each rule once: a timer around a clipboard call, and a
// feature check that stands in for a precondition check.
test('lint flags each habit that hides a precondition', async () => {
  assert.deepEqual(await lintFindings(folder), [
    'preconditions.js:123 no-restricted-syntax',
    'preconditions.js:65 no-restricted-syntax',
  ]);
});

test('each rule answers on its own', async () => {
  const eslint = new ESLint({ cwd: folder });
  const messages = async (code) =>
    (await eslint.lintText(code, { filePath: 'feature.js' }))[0].messages.map(
      (message) => message.message,
    );
  const guard =
    'The property is there, and the call can still fail on a policy, a permission, or the activation state. Handle the rejection instead.';
  const timer =
    'Transient activation expires. A timer callback can run without it, and then the browser refuses this call.';

  assert.deepEqual(await messages('if (navigator.clipboard) { copy(); }'), [
    guard,
  ]);
  assert.deepEqual(await messages("if ('wakeLock' in navigator) { hold(); }"), [
    guard,
  ]);
  assert.deepEqual(
    await messages('setTimeout(() => navigator.clipboard.writeText(t), 10);'),
    [timer],
  );
  assert.deepEqual(
    await messages('setTimeout(() => element.requestFullscreen(), 10);'),
    [timer],
  );
  // The call itself, inside a click handler, is the shape the rules want.
  assert.deepEqual(
    await messages(
      'button.addEventListener("click", () => navigator.clipboard.writeText(t).catch(report));',
    ),
    [],
  );
});
