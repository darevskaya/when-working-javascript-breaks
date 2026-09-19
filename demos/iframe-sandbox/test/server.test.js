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
  const page = await html(`${app}/demo/iframe-sandbox/no-sandbox`);
  assert.equal(
    page,
    await html(`${app}/demo/iframe-sandbox/sandbox-without-top-navigation`),
  );
  assert.equal(
    page,
    await html(`${app}/demo/iframe-sandbox/top-navigation-by-user-activation`),
  );
  await assertHeaders(app, {
    '/': {},
    '/demo/iframe-sandbox/no-sandbox': {},
    '/demo/iframe-sandbox/sandbox-without-top-navigation': {},
    '/demo/iframe-sandbox/top-navigation-by-user-activation': {},
    '/host-page.js': {},
    '/frame-loader.js': {},
  });
  // The embed login is the same page as the other Orbit ID logins.
  await assertHeaders(provider, { '/frame': {}, '/login/redirect': {} });
  assert.equal(
    await html(`${provider}/login/redirect`),
    await html(`${provider}/login/no-coop`),
  );
  assert.equal(
    await html(`${app}/frame-config.js`),
    "export const providerOrigin = 'http://127.0.0.1:4999';\n",
  );
});
