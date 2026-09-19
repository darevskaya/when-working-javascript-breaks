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
  const page = await html(`${app}/demo/broadcast/permissive`);
  assert.equal(page, await html(`${app}/demo/broadcast/host-coop`));
  assert.equal(page, await html(`${app}/demo/broadcast/restricted`));
  const coop = 'cross-origin-opener-policy';
  await assertHeaders(app, {
    '/': {},
    '/demo/broadcast/permissive': {},
    '/demo/broadcast/host-coop': { [coop]: 'same-origin' },
    '/demo/broadcast/restricted': {},
    '/demo/broadcast/callback': {},
    '/broadcast.js': {},
    '/callback.js': {},
  });
  await assertHeaders(provider, {
    '/login/permissive': {},
    '/login/restricted': { [coop]: 'same-origin' },
  });
});
