import { test } from 'node:test';
import { createServer } from '../server.js';
import { listen, assertHeaders } from '../../common/test-helpers.js';

test('the server exposes the factory and worker', async (t) => {
  const app = await listen(createServer(), t);
  await assertHeaders(app, {
    '/': {},
    '/demo/restrict-architecture-eslint': {},
    '/app.js': {},
    '/worker-factory.js': {},
    '/tasks.worker.js': {},
    '/app.css': {},
    '/styles.css': {},
  });
});
