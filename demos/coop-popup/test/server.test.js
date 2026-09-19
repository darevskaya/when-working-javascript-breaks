import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, createProviderServer } from '../server.js';
import { listen, assertHeaders } from '../../common/test-helpers.js';

test('COOP changes one header, with identical documents and scripts', async (t) => {
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
  assert.equal(page, await html(`${app}/demo/coop-popup/coop-on-app`));
  assert.equal(page, await html(`${app}/demo/coop-popup/coop-on-login`));
  assert.equal(
    await html(`${provider}/login/no-coop`),
    await html(`${provider}/login/coop`),
  );
  const coop = 'cross-origin-opener-policy';
  await assertHeaders(app, {
    '/': {},
    '/demo/coop-popup/no-coop': {},
    '/demo/coop-popup/coop-on-app': { [coop]: 'same-origin' },
    '/demo/coop-popup/coop-on-login': {},
    '/popup-login.js': {},
  });
  await assertHeaders(provider, {
    '/login/no-coop': {},
    '/login/coop': { [coop]: 'same-origin' },
    '/orbit-login.js': {},
  });
  assert.equal(
    await html(`${app}/login-config.js`),
    "export const providerOrigin = 'http://127.0.0.1:4999';\n",
  );
  assert.equal(
    await html(`${provider}/orbit-login-config.js`),
    "export const appOrigin = 'http://127.0.0.1:4998';\n",
  );
  for (const path of ['/login/unknown', '/popup-login.js']) {
    assert.equal((await fetch(`${provider}${path}`)).status, 404);
  }
});
