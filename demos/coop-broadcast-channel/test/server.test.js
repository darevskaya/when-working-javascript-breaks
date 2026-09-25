import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, createProviderServer } from '../server.js';
import { listen, assertHeaders } from '../../common/test-helpers.js';

test('the modes differ in one COOP header', async (t) => {
  const app = await listen(
    createServer({ providerOrigin: 'http://127.0.0.1:4999' }),
    t,
  );
  const provider = await listen(
    createProviderServer({ appOrigin: 'http://127.0.0.1:4998' }),
    t,
  );
  const html = async (url) => (await fetch(url)).text();
  const page = await html(`${app}/demo/coop-broadcast-channel/no-coop`);
  assert.equal(
    page,
    await html(`${app}/demo/coop-broadcast-channel/coop-on-app`),
  );
  assert.equal(
    page,
    await html(`${app}/demo/coop-broadcast-channel/coop-on-login`),
  );
  const coop = 'cross-origin-opener-policy';
  await assertHeaders(app, {
    '/': {},
    '/demo/coop-broadcast-channel/no-coop': {},
    '/demo/coop-broadcast-channel/coop-on-app': { [coop]: 'same-origin' },
    '/demo/coop-broadcast-channel/coop-on-login': {},
    '/demo/coop-broadcast-channel/callback': {},
    '/channel-login.js': {},
    '/callback.js': {},
  });
  await assertHeaders(provider, {
    '/provider/login/v1': {},
    '/provider/login/v2': { [coop]: 'same-origin' },
  });
});
