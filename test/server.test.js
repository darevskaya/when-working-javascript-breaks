import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, createProviderServer } from '../server.js';

test('static assets, demo entry routes, and one dialog bundle', async (t) => {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const permissive = await fetch(`${origin}/demo/calculator/permissive`);
  const restricted = await fetch(
    `${origin}/demo/calculator/restricted?policy=permissive`,
  );
  assert.equal(permissive.status, 200);
  assert.equal(restricted.status, 200);
  const policy = permissive.headers.get('content-security-policy');
  assert.match(policy, /'unsafe-eval'/);
  assert.equal(
    policy.replace(" 'unsafe-eval'", ''),
    restricted.headers.get('content-security-policy'),
  );
  const html = await permissive.text();
  assert.equal(html, await restricted.text());
  assert.doesNotMatch(html, /<iframe|src="\/bundles\//i);

  const response = await fetch(`${origin}/bundles/dialog.js`);
  assert.equal(response.status, 200);
  const source = await response.text();
  assert.doesNotMatch(source, /\beval\(/);
  assert.match(source, /new Function\(/);
  for (const asset of [
    '/calculator.js',
    '/styles.css',
    '/fractal.js',
    '/fractal-worker.js',
  ]) {
    assert.equal((await fetch(`${origin}${asset}`)).status, 200);
  }
  for (const route of [
    '/demo/calculator/unknown',
    '/demo/unknown/permissive',
    '/server.js',
  ]) {
    assert.equal((await fetch(`${origin}${route}`)).status, 404);
  }
  const root = await fetch(`${origin}/`, { redirect: 'manual' });
  assert.equal(root.status, 302);
  assert.equal(root.headers.get('location'), '/demo/calculator/permissive');
  for (const demo of ['calculator', 'fractal', 'coop']) {
    for (const suffix of ['', '/']) {
      const entry = await fetch(`${origin}/demo/${demo}${suffix}`, {
        redirect: 'manual',
      });
      assert.equal(entry.status, 302);
      assert.equal(entry.headers.get('location'), `/demo/${demo}/permissive`);
    }
    const page = await fetch(`${origin}/demo/${demo}/permissive`);
    assert.equal(page.status, 200);
    assert.match(await page.text(), new RegExp(`id="${demo}-controls"`));
  }
});

test('COOP changes only the provider header, with identical documents and scripts', async (t) => {
  const app = createServer({ providerPort: 4999 });
  const provider = createProviderServer({ appOrigin: 'http://127.0.0.1:4998' });
  for (const server of [app, provider]) {
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    t.after(() => new Promise((resolve) => server.close(resolve)));
  }
  const appOrigin = `http://127.0.0.1:${app.address().port}`;
  const providerOrigin = `http://127.0.0.1:${provider.address().port}`;
  const baseline = await fetch(`${providerOrigin}/login/permissive`);
  const restricted = await fetch(`${providerOrigin}/login/restricted`);
  assert.equal(baseline.status, 200);
  assert.equal(restricted.status, 200);
  assert.equal(baseline.headers.get('cross-origin-opener-policy'), null);
  assert.equal(
    restricted.headers.get('cross-origin-opener-policy'),
    'same-origin',
  );
  assert.equal(
    baseline.headers.get('content-security-policy'),
    restricted.headers.get('content-security-policy'),
  );
  assert.equal(await baseline.text(), await restricted.text());
  const first = await fetch(`${appOrigin}/demo/coop/permissive`);
  const second = await fetch(`${appOrigin}/demo/coop/restricted`);
  assert.equal(first.headers.get('cross-origin-opener-policy'), null);
  assert.equal(second.headers.get('cross-origin-opener-policy'), null);
  assert.equal(
    first.headers.get('content-security-policy'),
    second.headers.get('content-security-policy'),
  );
  assert.equal(await first.text(), await second.text());
  assert.equal(
    await (await fetch(`${appOrigin}/coop-config.js`)).text(),
    "export const providerOrigin = 'http://127.0.0.1:4999';\n",
  );
  assert.equal(
    await (await fetch(`${providerOrigin}/provider-config.js`)).text(),
    "export const appOrigin = 'http://127.0.0.1:4998';\n",
  );
  for (const asset of ['/provider.js', '/provider.css', '/styles.css']) {
    assert.equal((await fetch(`${providerOrigin}${asset}`)).status, 200);
  }
  assert.equal((await fetch(`${appOrigin}/coop.js`)).status, 200);
  for (const route of ['/login/unknown', '/server.js', '/coop.js']) {
    assert.equal((await fetch(`${providerOrigin}${route}`)).status, 404);
  }
});

test('fractal routes differ only in permission for Blob workers', async (t) => {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const permissive = await fetch(`${origin}/demo/fractal/permissive`);
  const restricted = await fetch(
    `${origin}/demo/fractal/restricted?policy=permissive`,
  );
  assert.equal(permissive.status, 200);
  assert.equal(restricted.status, 200);
  const policy = permissive.headers.get('content-security-policy');
  assert.match(policy, /worker-src 'self' blob:/);
  assert.doesNotMatch(policy, /unsafe-eval/);
  assert.equal(
    policy.replace(' blob:', ''),
    restricted.headers.get('content-security-policy'),
  );
  assert.equal(await permissive.text(), await restricted.text());
});
