import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ESLint } from 'eslint';
import { lintFindings } from '../../common/test-helpers.js';
import { findings } from '../../common/semgrep.js';

const folder = `${import.meta.dirname}/..`;

// innerhtml-string.js is the original, and no page loads it. The escaped copy
// still assigns a string, so the rule flags it too. innerhtml-policy.js writes
// through setHTML() from the trusted-html package, the one function that may
// write markup.
test('lint flags the original and the escaped widget', async () => {
  assert.deepEqual(await lintFindings(folder), [
    'innerhtml-escaped.js:23 no-restricted-syntax',
    'innerhtml-escaped.js:36 no-restricted-syntax',
    'innerhtml-string.js:22 no-restricted-syntax',
    'innerhtml-string.js:9 no-restricted-syntax',
  ]);
});

// Trusted Types blocks every string in these sinks, so the rule has no
// exception for a constant, an escaped string, or a tag name.
test('the rule flags every markup sink outside setHTML()', async () => {
  const eslint = new ESLint({ cwd: folder });
  const sinks = [
    'el.innerHTML = `<h2>${shop}</h2>`;',
    "el.innerHTML = '<b>Orbit ID</b>';",
    'el.innerHTML = escapeHTML`<h2>${shop}</h2>`;',
    "el['innerHTML'] = markup;",
    'el.innerHTML += markup;',
    'el.outerHTML = markup;',
    "el.insertAdjacentHTML('beforeend', markup);",
    'document.write(markup);',
  ];
  for (const code of sinks) {
    const [outside] = await eslint.lintText(code, { filePath: 'widget.js' });
    assert.deepEqual(
      outside.messages.map((message) => message.ruleId),
      ['no-restricted-syntax'],
      code,
    );
    // In the trusted-html package, only the setHTML function may write markup.
    const [inside] = await eslint.lintText(
      `export function setHTML(el) { return () => { ${code} }; }`,
      { filePath: 'trusted-html/index.js' },
    );
    assert.deepEqual(inside.messages, [], code);
    const [other] = await eslint.lintText(`function render(el) { ${code} }`, {
      filePath: 'trusted-html/index.js',
    });
    assert.deepEqual(
      other.messages.map((message) => message.ruleId),
      ['no-restricted-syntax'],
      code,
    );
  }
});

test('code imports setHTML from the package, not by path', async () => {
  const eslint = new ESLint({ cwd: folder });
  const rules = async (code) =>
    (await eslint.lintText(code, { filePath: 'widget.js' }))[0].messages.map(
      (message) => message.ruleId,
    );
  assert.deepEqual(await rules("import { setHTML } from 'trusted-html';"), []);
  assert.deepEqual(
    await rules("import { setHTML } from './trusted-html/index.js';"),
    ['no-restricted-imports'],
  );
});

const semgrep = findings(`${folder}/.semgrep.yml`, folder);
test(
  'Semgrep flags the same lines',
  { skip: !semgrep && 'Semgrep is not installed' },
  () => {
    assert.deepEqual(semgrep, [
      'innerhtml-escaped.js:23 trusted-types-markup-sink',
      'innerhtml-escaped.js:36 trusted-types-markup-sink',
      'innerhtml-string.js:22 trusted-types-markup-sink',
      'innerhtml-string.js:9 trusted-types-markup-sink',
    ]);
  },
);
