import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, fromConfig } from '../server.js';
import { config } from '../config.js';
import { listen, assertHeaders } from '../../common/test-helpers.js';

const csp = 'content-security-policy';

test('the page policy names exactly the script in config.js', async (t) => {
  const origin = 'http://127.0.0.1:4210';
  const app = await listen(createServer({ origin }), t);
  await assertHeaders(app, {
    '/': {},
    '/demo/worker-src-eslint/from-config': {
      [csp]: `worker-src ${origin}${config.workerScript}`,
    },
    '/demo/worker-src-eslint/narrow-policy': { [csp]: "worker-src 'none'" },
    '/app.js': {},
    '/worker-client.js': {},
    '/config.js': {},
    [config.workerScript]: {},
    '/app.css': {},
    '/styles.css': {},
  });
  const page = async (route) =>
    (await fetch(`${app}/demo/worker-src-eslint/${route}`)).text();
  assert.equal(await page('from-config'), await page('narrow-policy'));
  assert.equal((await fetch(`${app}/server.js`)).status, 404);
});

test('the policy follows the origin the server runs on', async (t) => {
  const app = await listen(createServer({ origin: 'https://widget.test' }), t);
  assert.equal(
    fromConfig('https://widget.test'),
    `worker-src https://widget.test${config.workerScript}`,
  );
  await assertHeaders(app, {
    '/demo/worker-src-eslint/from-config': {
      [csp]: `worker-src https://widget.test${config.workerScript}`,
    },
  });
});
