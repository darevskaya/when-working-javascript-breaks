import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, createApiServer } from '../server.js';
import { apiOrigins } from '../contract.js';
import { listen, assertHeaders } from '../../common/test-helpers.js';

test('the page policy and the API use the contract origins', async (t) => {
  const app = await listen(createServer(), t);
  const api = await listen(createApiServer({ appOrigin: app }), t);
  await assertHeaders(app, {
    '/': {},
    '/demo/connect-src-api-client/api-calls': {
      'content-security-policy': `connect-src 'self' ${apiOrigins.join(' ')}`,
    },
    '/app.js': {},
    '/api-client.js': {},
    '/config.js': {},
  });
  await assertHeaders(api, {
    '/profile': { 'access-control-allow-origin': app },
    '/status': { 'access-control-allow-origin': app },
  });
  assert.deepEqual(await (await fetch(`${api}/profile`)).json(), {
    name: 'Elena',
  });
});
