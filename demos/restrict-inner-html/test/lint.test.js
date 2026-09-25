import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ESLint } from 'eslint';
import { lintFindings } from '../../common/test-helpers.js';

const folder = `${import.meta.dirname}/..`;

test('lint:forbid flags every markup sink', async () => {
  assert.deepEqual(
    await lintFindings(folder, { config: 'eslint.forbid.config.js' }),
    [
      'render-with-policy.js:24 no-restricted-properties',
      'render-with-string.js:2 no-restricted-properties',
    ],
  );
});

test('lint:escape-html allows policyHtml with escapeHtml and flags the rest', async () => {
  assert.deepEqual(
    await lintFindings(folder, { config: 'eslint.escape-html.config.js' }),
    ['render-with-string.js:2 no-restricted-syntax'],
  );
});

const lines = {
  string: 'element.innerHTML = markup;',
  policy: 'element.innerHTML = policyHtml(`<p>${escapeHtml(value)}</p>`);',
  unescaped: 'element.innerHTML = policyHtml(`<p>${value}</p>`);',
  variable: 'element.innerHTML = policyHtml(markup);',
  dom: 'element.replaceChildren(node);',
};

const flagged = async (config, filePath) => {
  const eslint = new ESLint({
    cwd: folder,
    overrideConfigFile: `${folder}/${config}`,
  });
  const names = [];
  for (const [name, code] of Object.entries(lines)) {
    const [result] = await eslint.lintText(code, { filePath });
    if (result.messages.length > 0) names.push(name);
  }
  return names;
};

test('each configuration allows exactly one way to write markup', async () => {
  assert.deepEqual(
    await flagged('eslint.forbid.config.js', 'render-with-dom.js'),
    ['string', 'policy', 'unescaped', 'variable'],
  );
  assert.deepEqual(
    await flagged('eslint.escape-html.config.js', 'render-with-policy.js'),
    ['string', 'unescaped', 'variable'],
  );
});
