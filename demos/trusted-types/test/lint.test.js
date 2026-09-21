import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ESLint } from 'eslint';
import { lintFindings } from '../../common/test-helpers.js';

const folder = `${import.meta.dirname}/..`;

test('lint:forbid flags every markup sink', async () => {
  assert.deepEqual(
    await lintFindings(folder, { config: 'eslint.forbid.config.js' }),
    [
      'app.js:31 no-restricted-properties',
      'app.js:41 no-restricted-properties',
      'app.js:51 no-restricted-properties',
    ],
  );
});

test('lint:escape allows escapeHtml and flags the rest', async () => {
  assert.deepEqual(
    await lintFindings(folder, { config: 'eslint.escape.config.js' }),
    ['app.js:31 no-restricted-syntax', 'app.js:51 no-restricted-syntax'],
  );
});

test('lint:trusted-types allows policyHtml and flags the rest', async () => {
  assert.deepEqual(
    await lintFindings(folder, { config: 'eslint.trusted-types.config.js' }),
    ['app.js:31 no-restricted-syntax', 'app.js:41 no-restricted-syntax'],
  );
});

const lines = {
  string: 'element.innerHTML = markup;',
  escape: 'element.innerHTML = escapeHtml`<p>${value}</p>`;',
  policy: 'element.innerHTML = policyHtml`<p>${value}</p>`;',
  dom: 'element.replaceChildren(node);',
  call: 'element.insertAdjacentHTML("beforeend", markup);',
};

const flagged = async (config) => {
  const eslint = new ESLint({
    cwd: folder,
    overrideConfigFile: `${folder}/${config}`,
  });
  const names = [];
  for (const [name, code] of Object.entries(lines)) {
    const [result] = await eslint.lintText(code, { filePath: 'feature.js' });
    if (result.messages.length > 0) names.push(name);
  }
  return names;
};

test('each configuration allows exactly one way to write markup', async () => {
  assert.deepEqual(await flagged('eslint.forbid.config.js'), [
    'string',
    'escape',
    'policy',
    'call',
  ]);
  assert.deepEqual(await flagged('eslint.escape.config.js'), [
    'string',
    'policy',
    'call',
  ]);
  assert.deepEqual(await flagged('eslint.trusted-types.config.js'), [
    'string',
    'escape',
    'call',
  ]);
});
