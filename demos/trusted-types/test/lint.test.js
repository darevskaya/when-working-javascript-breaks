import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ESLint } from 'eslint';
import { lintFindings } from '../../common/test-helpers.js';

const folder = `${import.meta.dirname}/..`;

// app.js writes the same widget in four styles, on purpose. Each lint allows
// one style and flags the others, so each one fails here with a known list.
// The line numbers are the innerHTML lines of renderString, renderEscape and
// renderPolicy, in that order.
test('lint:forbid flags every markup sink', async () => {
  assert.deepEqual(
    await lintFindings(folder, { config: 'eslint.forbid.config.js' }),
    [
      'app.js:55 no-restricted-properties',
      'app.js:69 no-restricted-properties',
      'app.js:83 no-restricted-properties',
    ],
  );
});

test('lint:escape allows escapeHtml and flags the rest', async () => {
  assert.deepEqual(
    await lintFindings(folder, { config: 'eslint.escape.config.js' }),
    ['app.js:55 no-restricted-syntax', 'app.js:83 no-restricted-syntax'],
  );
});

test('lint:trusted-types allows policyHtml and flags the rest', async () => {
  assert.deepEqual(
    await lintFindings(folder, { config: 'eslint.trusted-types.config.js' }),
    ['app.js:55 no-restricted-syntax', 'app.js:69 no-restricted-syntax'],
  );
});

// One line of code through the three configurations.
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
  // Nothing writes markup. Only the DOM line passes.
  assert.deepEqual(await flagged('eslint.forbid.config.js'), [
    'string',
    'escape',
    'policy',
    'call',
  ]);
  // escapeHtml passes. The DOM line writes no markup, so it passes too.
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
