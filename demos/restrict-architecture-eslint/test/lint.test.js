import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ESLint } from 'eslint';
import { lintFindings } from '../../common/test-helpers.js';

const folder = `${import.meta.dirname}/..`;

test('the demo has no lint finding', async () => {
  assert.deepEqual(await lintFindings(folder), []);
});

const eslint = new ESLint({ cwd: folder });
const messages = async (code, filePath) =>
  (await eslint.lintText(code, { filePath }))[0].messages.map(
    (message) => message.message,
  );

test('page code calls no fetch and names no origin', async () => {
  assert.deepEqual(await messages("fetch('/profile');", 'app.js'), [
    'Call the API through api-client.js.',
  ]);
  assert.deepEqual(await messages('window.fetch(url);', 'app.js'), [
    'Call the API through api-client.js.',
  ]);
  assert.deepEqual(
    await messages("const origin = 'https://api.example.com';", 'app.js'),
    ['Put each API origin in config.js.'],
  );
  assert.deepEqual(await messages('getProfile();', 'app.js'), []);
});

test('the API client may call fetch, and may not name an origin', async () => {
  assert.deepEqual(
    await messages(
      "fetch(new URL('/profile', config.apiOrigin));",
      'api-client.js',
    ),
    [],
  );
  assert.deepEqual(
    await messages(
      "fetch('https://api.example.com/profile');",
      'api-client.js',
    ),
    ['Put each API origin in config.js.'],
  );
  assert.deepEqual(
    await messages('fetch(`${config.apiOrigin}/profile`);', 'api-client.js'),
    [],
  );
});

test('the configuration may name an origin, and may not call fetch', async () => {
  assert.deepEqual(
    await messages(
      "export const config = { apiOrigin: 'https://api.example.com' };",
      'config.js',
    ),
    [],
  );
  assert.deepEqual(await messages("fetch('/profile');", 'config.js'), [
    'Call the API through api-client.js.',
  ]);
});
