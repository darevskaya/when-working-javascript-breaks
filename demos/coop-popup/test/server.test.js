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
  const page = await html(`${app}/demo/coop/permissive`);
  assert.equal(page, await html(`${app}/demo/coop/host-coop`));
  assert.equal(page, await html(`${app}/demo/coop/restricted`));
  assert.equal(
    await html(`${provider}/login/permissive`),
    await html(`${provider}/login/restricted`),
  );
  const coop = 'cross-origin-opener-policy';
  await assertHeaders(app, {
    '/': {},
    '/demo/coop/permissive': {},
    '/demo/coop/host-coop': { [coop]: 'same-origin' },
    '/demo/coop/restricted': {},
    '/coop.js': {},
  });
  await assertHeaders(provider, {
    '/login/permissive': {},
    '/login/restricted': { [coop]: 'same-origin' },
    '/provider.js': {},
  });
  assert.equal(
    await html(`${app}/coop-config.js`),
    "export const providerOrigin = 'http://127.0.0.1:4999';\n",
  );
  assert.equal(
    await html(`${provider}/provider-config.js`),
    "export const appOrigin = 'http://127.0.0.1:4998';\n",
  );
  for (const path of ['/login/unknown', '/coop.js']) {
    assert.equal((await fetch(`${provider}${path}`)).status, 404);
  }
});
