import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, createProviderServer } from '../server.js';
import { listen, assertHeaders } from '../../common/test-helpers.js';

test('COOP changes one header, with identical login documents and scripts', async (t) => {
  const app = await listen(
    createServer({ providerOrigin: 'http://127.0.0.1:4999' }),
    t,
  );
  const provider = await listen(
    createProviderServer({ appOrigin: 'http://127.0.0.1:4998' }),
    t,
  );
  const html = async (url) => (await fetch(url)).text();
  const page = await html(`${app}/demo/coop-popup/no-coop`);
  assert.equal(page, await html(`${app}/demo/coop-popup/with-coop`));
  assert.equal(
    await html(`${provider}/provider/login/no-coop`),
    await html(`${provider}/provider/login/with-coop`),
  );
  const coop = 'cross-origin-opener-policy';
  await assertHeaders(app, {
    '/': {},
    '/demo/coop-popup/no-coop': {},
    '/demo/coop-popup/with-coop': {},
    '/app/popup.js': {},
    '/login/callback': {},
    '/app/callback.js': {},
  });
  await assertHeaders(provider, {
    '/provider/login/no-coop': {},
    '/provider/login/with-coop': { [coop]: 'same-origin' },
    '/provider/login.js': {},
  });
  assert.equal(
    await html(`${app}/app-config.js`),
    "export const providerOrigin = 'http://127.0.0.1:4999';\n",
  );
  assert.equal(
    await html(`${provider}/provider-config.js`),
    "export const appOrigin = 'http://127.0.0.1:4998';\n",
  );
  for (const path of ['/provider/login/unknown', '/app/popup.js']) {
    assert.equal((await fetch(`${provider}${path}`)).status, 404);
  }
});
