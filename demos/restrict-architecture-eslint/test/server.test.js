import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, createApiServer } from '../server.js';
import { config } from '../config.js';
import { listen, assertHeaders } from '../../common/test-helpers.js';

const csp = 'content-security-policy';

test('the page policy names exactly the origins in config.js', async (t) => {
  const app = await listen(createServer(), t);
  const origins = Object.values(config);
  await assertHeaders(app, {
    '/': {},
    '/demo/restrict-architecture-eslint/from-config': {
      [csp]: `connect-src 'self' ${origins.join(' ')}`,
    },
    '/demo/restrict-architecture-eslint/narrow-policy': {
      [csp]: "connect-src 'self'",
    },
    '/app.js': {},
    '/api-client.js': {},
    '/config.js': {},
    '/app.css': {},
    '/styles.css': {},
  });
  // Both routes serve the same page and the same script.
  const page = async (route) =>
    (await fetch(`${app}/demo/restrict-architecture-eslint/${route}`)).text();
  assert.equal(await page('from-config'), await page('narrow-policy'));
  assert.equal((await fetch(`${app}/server.js`)).status, 404);
});

test('the API answers on the origin that config.js names', async (t) => {
  const app = await listen(createServer(), t);
  const api = await listen(createApiServer({ appOrigin: app }), t);
  await assertHeaders(api, {
    '/profile': { 'access-control-allow-origin': app },
    '/status': { 'access-control-allow-origin': app },
  });
  assert.deepEqual(await (await fetch(`${api}/profile`)).json(), {
    name: 'Elena',
  });
});
