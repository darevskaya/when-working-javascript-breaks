import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, createProviderServer } from '../server.js';
import { listen, assertHeaders } from '../../common/test-helpers.js';

test('the pages send no policy and serve the same HTML', async (t) => {
  const app = await listen(
    createServer({ providerOrigin: 'http://127.0.0.1:4999' }),
    t,
  );
  const provider = await listen(
    createProviderServer({ appOrigin: 'http://127.0.0.1:4998' }),
    t,
  );
  const html = async (url) => (await fetch(url)).text();
  const page = await html(`${app}/demo/embed/no-sandbox`);
  assert.equal(page, await html(`${app}/demo/embed/no-top-navigation`));
  assert.equal(page, await html(`${app}/demo/embed/user-activation`));
  await assertHeaders(app, {
    '/': {},
    '/demo/embed/no-sandbox': {},
    '/demo/embed/no-top-navigation': {},
    '/demo/embed/user-activation': {},
    '/embed.js': {},
    '/orbit-loader.js': {},
  });
  // The embed login is the same page as the other Orbit ID logins.
  await assertHeaders(provider, { '/embed': {}, '/login/embed': {} });
  assert.equal(
    await html(`${provider}/login/embed`),
    await html(`${provider}/login/permissive`),
  );
  assert.equal(
    await html(`${app}/embed-config.js`),
    "export const providerOrigin = 'http://127.0.0.1:4999';\n",
  );
});
