import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ESLint } from 'eslint';
import { lintFindings } from '../../common/test-helpers.js';
import { findings } from '../../common/semgrep.js';

const folder = `${import.meta.dirname}/..`;

// widget.js is the original, and no page loads it. Both rules flag its two
// innerHTML lines. no-unsanitized accepts the escaped values in
// widget-escaped.js, but Trusted Types does not, so only the innerHTML rule
// flags them. html`…` returns TrustedHTML, so both rules accept
// widget-policy.js.
test('lint flags the original and the escaped widget', async () => {
  assert.deepEqual(await lintFindings(folder), [
    'widget-escaped.js:23 no-restricted-syntax',
    'widget-escaped.js:36 no-restricted-syntax',
    'widget.js:22 no-restricted-syntax',
    'widget.js:22 no-unsanitized/property',
    'widget.js:9 no-restricted-syntax',
    'widget.js:9 no-unsanitized/property',
  ]);
});

// Trusted Types blocks every string in these sinks. no-unsanitized looks for
// XSS, so it allows constant strings. The innerHTML rule sees only innerHTML.
test('each markup rule sees sinks that the other one misses', async () => {
  const eslint = new ESLint({ cwd: folder });
  const cases = {
    'el.innerHTML = `<h2>${shop}</h2>`;': [
      'no-restricted-syntax',
      'no-unsanitized/property',
    ],
    "el.innerHTML = '<b>Orbit ID</b>';": ['no-restricted-syntax'],
    "el['innerHTML'] = markup;": ['no-restricted-syntax'],
    'el.innerHTML = escapeHTML`<h2>${shop}</h2>`;': ['no-restricted-syntax'],
    'el.innerHTML = html`<h2>${shop}</h2>`;': [],
    'el.outerHTML = markup;': ['no-unsanitized/property'],
    "el.insertAdjacentHTML('beforeend', markup);": ['no-unsanitized/method'],
    'document.write(markup);': ['no-unsanitized/method'],
  };
  for (const [code, expected] of Object.entries(cases)) {
    const [result] = await eslint.lintText(code, { filePath: 'example.js' });
    assert.deepEqual(
      result.messages.map((message) => message.ruleId).sort(),
      expected,
      code,
    );
  }
});

const semgrep = findings(`${folder}/.semgrep.yml`, folder);
test(
  'Semgrep flags the same lines',
  { skip: !semgrep && 'Semgrep is not installed' },
  () => {
    assert.deepEqual(semgrep, [
      'widget-escaped.js:23 trusted-types-markup-sink',
      'widget-escaped.js:36 trusted-types-markup-sink',
      'widget.js:22 trusted-types-markup-sink',
      'widget.js:9 trusted-types-markup-sink',
    ]);
  },
);
