import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ESLint } from 'eslint';
import { lintFindings } from '../../common/test-helpers.js';
import { findings } from '../../common/semgrep.js';
import { noMarkupAnywhere } from '../eslint.config.js';

const folder = `${import.meta.dirname}/..`;

// string-widget.js is the original widget, and no page loads it. The two
// widgets that the pages load write no markup from a string, so lint passes
// on both of them.
test('lint flags the original widget and nothing else', async () => {
  assert.deepEqual(await lintFindings(folder), [
    'string-widget.js:21 no-restricted-properties',
    'string-widget.js:8 no-restricted-properties',
  ]);
});

const sinks = [
  'el.innerHTML = `<h2>${shop}</h2>`;',
  "el.innerHTML = '<b>Orbit ID</b>';",
  'el.innerHTML = escapeHTML`<h2>${shop}</h2>`;',
  "el['innerHTML'] = markup;",
  'el.innerHTML += markup;',
  'el.outerHTML = markup;',
  'frame.srcdoc = page;',
  "el.insertAdjacentHTML('beforeend', markup);",
  'el.setHTMLUnsafe(markup);',
  'document.write(markup);',
];

// Trusted Types refuses every string in these sinks, so the rule has no
// exception for a constant, an escaped string, or a tag name.
test('option B flags every sink outside the trusted-html package', async () => {
  const eslint = new ESLint({ cwd: folder });
  for (const code of sinks) {
    const [widget] = await eslint.lintText(code, { filePath: 'widget.js' });
    assert.deepEqual(
      widget.messages.map((message) => message.ruleId),
      ['no-restricted-properties'],
      code,
    );
    // setHTML() lives here, owns the policy, and escapes each value.
    const [inside] = await eslint.lintText(code, {
      filePath: 'trusted-html/index.js',
    });
    assert.deepEqual(inside.messages, [], code);
  }
});

// Option A bans the sinks in every file, the trusted-html package included.
test('option A flags every sink in every file', async () => {
  const eslint = new ESLint({
    cwd: folder,
    overrideConfigFile: true,
    overrideConfig: noMarkupAnywhere,
  });
  for (const code of sinks) {
    const [inside] = await eslint.lintText(code, {
      filePath: 'trusted-html/index.js',
    });
    assert.deepEqual(
      inside.messages.map((message) => message.ruleId),
      ['no-restricted-properties'],
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
      'string-widget.js:21 trusted-types-markup-sink',
      'string-widget.js:8 trusted-types-markup-sink',
    ]);
  },
);
