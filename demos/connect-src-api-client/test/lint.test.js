import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ESLint } from 'eslint';
import { lintFindings } from '../../common/test-helpers.js';

const folder = `${import.meta.dirname}/..`;

// The page code breaks each rule once: a direct fetch in app.js, a hard-coded
// URL in api-client.js, and an origin in config.js that the contract lacks.
test('lint flags each call that skips the contract', async () => {
  assert.deepEqual(await lintFindings(folder), [
    'api-client.js:18 no-restricted-syntax',
    'api-client.js:18 no-restricted-syntax',
    'app.js:22 no-restricted-syntax',
    'app.js:22 no-restricted-syntax',
    'config.js:6 no-restricted-syntax',
  ]);
});

test('each file has its own rule', async () => {
  const eslint = new ESLint({ cwd: folder });
  const messages = async (code, filePath) =>
    (await eslint.lintText(code, { filePath }))[0].messages.map(
      (message) => message.message,
    );
  // Page code: no fetch, and no origin.
  assert.deepEqual(await messages("fetch('/profile');", 'feature.js'), [
    'Call the API through api-client.js.',
  ]);
  assert.deepEqual(await messages('window.fetch(url);', 'feature.js'), [
    'Call the API through api-client.js.',
  ]);
  assert.deepEqual(
    await messages("const origin = 'https://api.example.com';", 'feature.js'),
    ['Put each API origin in config.js.'],
  );
  // The API client: each URL starts from config.
  assert.deepEqual(
    await messages(
      "fetch(new URL('/profile', config.apiOrigin));",
      'api-client.js',
    ),
    [],
  );
  assert.deepEqual(
    await messages('fetch(`${config.apiOrigin}/profile`);', 'api-client.js'),
    ['Build each URL from config: fetch(new URL(path, config.apiOrigin)).'],
  );
  // The configuration: only the contract origins.
  assert.deepEqual(
    await messages(
      "export const config = { apiOrigin: 'http://127.0.0.1:4308' };",
      'config.js',
    ),
    [],
  );
  assert.deepEqual(
    await messages(
      "export const config = { apiOrigin: 'https://api.example.com' };",
      'config.js',
    ),
    [
      'This origin is not in contract.js, so the customer connect-src does not allow it.',
    ],
  );
});
