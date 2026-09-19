import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, createProviderServer } from '../server.js';

test('static assets, demo entry routes, and both dialog bundles', async (t) => {
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
  assert.equal(policy, "script-src 'self' 'unsafe-eval'");
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
  // The eval build is the other way around: no new Function, but eval.
  const evalBuild = await (
    await fetch(`${origin}/bundles/eval/dialog.js`)
  ).text();
  assert.match(evalBuild, /\beval\(/);
  assert.doesNotMatch(evalBuild, /new Function\(/);
  for (const asset of [
    '/sdk.js',
    '/sdk.css',
    '/shop.css',
    '/calculator.js',
    '/styles.css',
    '/fractal.js',
    '/fractal-worker.js',
    '/worker-factory.js',
    '/fractal-module-worker.js',
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
  // The index links to every demo mode, and every link opens a page.
  const index = await (await fetch(`${origin}/`)).text();
  const links = [...index.matchAll(/href="(\/demo\/[^"]+)"/g)].map(
    (match) => match[1],
  );
  assert.deepEqual(links, [
    '/demo/sdk/permissive',
    '/demo/sdk/restricted',
    '/demo/calculator/permissive',
    '/demo/calculator/restricted',
    '/demo/calculator/eval-build',
    '/demo/fractal/permissive',
    '/demo/fractal/restricted',
    '/demo/fractal/module',
    '/demo/coop/permissive',
    '/demo/coop/restricted',
    '/demo/reporting',
  ]);
  for (const link of links) {
    assert.equal((await fetch(`${origin}${link}`)).status, 200, link);
  }
});

test('COOP changes only the provider header, with identical documents and scripts', async (t) => {
  const app = createServer({ providerOrigin: 'http://127.0.0.1:4999' });
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

test('the shop routes differ only in the Trusted Types policy', async (t) => {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const permissive = await fetch(`${origin}/demo/sdk/permissive`);
  const restricted = await fetch(`${origin}/demo/sdk/restricted`);
  assert.equal(permissive.status, 200);
  assert.equal(restricted.status, 200);
  assert.equal(permissive.headers.get('content-security-policy'), null);
  assert.equal(
    restricted.headers.get('content-security-policy'),
    "require-trusted-types-for 'script'",
  );
  assert.equal(await permissive.text(), await restricted.text());
  // The widget writes its markup with innerHTML, the line the policy stops.
  const sdk = await (await fetch(`${origin}/sdk.js`)).text();
  assert.match(sdk, /\.innerHTML = `/);
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
  assert.equal(policy, "worker-src 'self' blob:");
  assert.doesNotMatch(policy, /unsafe-eval/);
  assert.equal(
    policy.replace(' blob:', ''),
    restricted.headers.get('content-security-policy'),
  );
  assert.equal(await permissive.text(), await restricted.text());
});

test('responses contain only the demonstrated policies and ordinary HTTP headers', async (t) => {
  // Headers every HTTP response may carry. A route sends the policy headers
  // listed below on top of these, or none at all. Anything else fails the test.
  const ordinary = new Set([
    'content-type',
    'content-length',
    'date',
    'connection',
    'keep-alive',
    'location',
    'transfer-encoding',
  ]);
  const csp = 'content-security-policy';
  const endpoints = { 'reporting-endpoints': 'demo="/reports"' };
  const cases = [
    {
      server: createServer(),
      routes: [
        { path: '/demo/sdk/permissive' },
        {
          path: '/demo/sdk/restricted',
          headers: { [csp]: "require-trusted-types-for 'script'" },
        },
        {
          path: '/demo/calculator/permissive',
          headers: { [csp]: "script-src 'self' 'unsafe-eval'" },
        },
        {
          path: '/demo/calculator/restricted',
          headers: { [csp]: "script-src 'self'" },
        },
        {
          path: '/demo/calculator/eval-build',
          headers: { [csp]: "script-src 'self'" },
        },
        {
          path: '/demo/fractal/permissive',
          headers: { [csp]: "worker-src 'self' blob:" },
        },
        {
          path: '/demo/fractal/restricted',
          headers: { [csp]: "worker-src 'self'" },
        },
        {
          path: '/demo/fractal/module',
          headers: { [csp]: "worker-src 'self'" },
        },
        { path: '/demo/coop/permissive' },
        { path: '/demo/coop/restricted' },
        { path: '/demo/profile' },
        // Each reporting route names the receiver, then points one policy at
        // that name. The legacy route names no receiver.
        { path: '/demo/reporting' },
        {
          path: '/demo/reporting/csp/enforce',
          headers: { ...endpoints, [csp]: "script-src 'self'; report-to demo" },
        },
        {
          path: '/demo/reporting/csp/report-only',
          headers: {
            ...endpoints,
            'content-security-policy-report-only':
              "script-src 'self'; report-to demo",
          },
        },
        {
          path: '/demo/reporting/csp/legacy',
          headers: { [csp]: "script-src 'self'; report-uri /reports" },
        },
        {
          path: '/demo/reporting/coop/enforce',
          headers: {
            ...endpoints,
            'cross-origin-opener-policy': 'same-origin; report-to="demo"',
          },
        },
        {
          path: '/demo/reporting/coop/report-only',
          headers: {
            ...endpoints,
            'cross-origin-opener-policy-report-only':
              'same-origin; report-to="demo"',
          },
        },
        {
          path: '/demo/reporting/coep/enforce',
          headers: {
            ...endpoints,
            'cross-origin-embedder-policy': 'require-corp; report-to="demo"',
          },
        },
        {
          path: '/demo/reporting/coep/report-only',
          headers: {
            ...endpoints,
            'cross-origin-embedder-policy-report-only':
              'require-corp; report-to="demo"',
          },
        },
        { path: '/reporting.js' },
        { path: '/sdk.js' },
        { path: '/calculator.js' },
        { path: '/profile.js' },
        { path: '/bundles/dialog.js' },
        { path: '/coop-config.js' },
        { path: '/' },
        { path: '/missing' },
        { path: '/provider.js' },
        { path: '/calculator.html' },
      ],
    },
    {
      server: createProviderServer(),
      routes: [
        { path: '/login/permissive' },
        {
          path: '/login/restricted',
          headers: { 'cross-origin-opener-policy': 'same-origin' },
        },
        { path: '/reporting-popup' },
        { path: '/reporting-resource.js' },
        { path: '/provider.js' },
        { path: '/provider-config.js' },
        { path: '/missing' },
        { path: '/calculator.js' },
        { path: '/provider.html' },
      ],
    },
  ];
  for (const { server, routes } of cases) {
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    t.after(() => new Promise((resolve) => server.close(resolve)));
    const origin = `http://127.0.0.1:${server.address().port}`;
    for (const { path, headers = {} } of routes) {
      const response = await fetch(`${origin}${path}`, { redirect: 'manual' });
      await response.arrayBuffer();
      for (const [name, value] of Object.entries(headers)) {
        assert.equal(response.headers.get(name), value, path);
      }
      for (const name of response.headers.keys()) {
        assert.ok(
          ordinary.has(name) || name in headers,
          `${path}: unexpected ${name}`,
        );
      }
    }
  }
});
