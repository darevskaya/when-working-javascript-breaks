import { test } from 'node:test';
import { createServer } from '../server.js';
import { modes } from '../routes.js';
import { listen, assertHeaders } from '../../common/test-helpers.js';

test('each mode sends its own headers and nothing else', async (t) => {
  const app = await listen(createServer(), t);
  await assertHeaders(app, {
    '/': {},
    '/app.js': {},
    '/preconditions.js': {},
    '/routes.js': {},
    '/service-worker.js': {},
    ...Object.fromEntries(
      modes.map((mode) => [
        mode.path,
        Object.fromEntries(
          Object.entries(mode.headers).map(([name, value]) => [
            name.toLowerCase(),
            value,
          ]),
        ),
      ]),
    ),
  });
});
