import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, createProviderServer } from '../server.js';

test('static assets and demo entry routes', async (t) => {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const origin = `http://127.0.0.1:${server.address().port}`;
  // The two order summary routes differ only in 'unsafe-eval'. A query
  // string does not pick another route.
  const permissive = await fetch(`${origin}/demo/summary/permissive`);
  const restricted = await fetch(
    `${origin}/demo/summary/restricted?policy=permissive`,
  );
  assert.equal(permissive.status, 200);
  assert.equal(restricted.status, 200);
  const policy = permissive.headers.get('content-security-policy');
  assert.equal(policy, "script-src 'self' 'unsafe-eval'");
  assert.equal(
    policy.replace(" 'unsafe-eval'", ''),
    restricted.headers.get('content-security-policy'),
  );
  assert.equal(await permissive.text(), await restricted.text());
  const renderer = await (await fetch(`${origin}/template.js`)).text();
  assert.match(renderer, /\beval\(/);
  for (const asset of [
    '/widget-escaped.js',
    '/widget-policy.js',
    '/orbit.css',
    '/shop.css',
    '/embed.js',
    '/embed.css',
    '/orbit-loader.js',
    '/summary.js',
    '/summary.css',
    '/template.js',
    '/styles.css',
    '/fractal.js',
    '/fractal-worker.js',
    '/worker-factory.js',
    '/fractal-module-worker.js',
  ]) {
    assert.equal((await fetch(`${origin}${asset}`)).status, 200);
  }
  for (const route of [
    '/demo/summary/unknown',
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
    '/demo/widget/escaped',
    '/demo/widget/policy',
    '/demo/widget/policy-not-allowed',
    '/demo/embed/no-sandbox',
    '/demo/embed/no-top-navigation',
    '/demo/embed/user-activation',
    '/demo/summary/permissive',
    '/demo/summary/restricted',
    '/demo/fractal/permissive',
    '/demo/fractal/restricted',
    '/demo/fractal/module',
    '/demo/coop/permissive',
    '/demo/coop/host-coop',
    '/demo/coop/restricted',
    '/demo/broadcast/permissive',
    '/demo/broadcast/host-coop',
    '/demo/broadcast/restricted',
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
  // The host-coop page is the same document with COOP on the app side.
  const host = await fetch(`${appOrigin}/demo/coop/host-coop`);
  assert.equal(host.headers.get('cross-origin-opener-policy'), 'same-origin');
  assert.equal(
    await host.text(),
    await (await fetch(`${appOrigin}/demo/coop/permissive`)).text(),
  );
  assert.equal(
    await (await fetch(`${appOrigin}/coop-config.js`)).text(),
    "export const providerOrigin = 'http://127.0.0.1:4999';\n",
  );
  assert.equal(
    await (await fetch(`${providerOrigin}/provider-config.js`)).text(),
    "export const appOrigin = 'http://127.0.0.1:4998';\n",
  );
  assert.equal(
    await (await fetch(`${appOrigin}/embed-config.js`)).text(),
    "export const providerOrigin = 'http://127.0.0.1:4999';\n",
  );
  // The embed login is the same page as the COOP login, with no COOP.
  const embedLogin = await fetch(`${providerOrigin}/login/embed`);
  assert.equal(embedLogin.headers.get('cross-origin-opener-policy'), null);
  assert.equal(
    await embedLogin.text(),
    await (await fetch(`${providerOrigin}/login/permissive`)).text(),
  );
  for (const asset of [
    '/provider.js',
    '/provider.css',
    '/styles.css',
    '/embed',
    '/frame.js',
    '/orbit.css',
  ]) {
    assert.equal((await fetch(`${providerOrigin}${asset}`)).status, 200);
  }
  assert.equal((await fetch(`${appOrigin}/coop.js`)).status, 200);
  for (const route of ['/login/unknown', '/server.js', '/coop.js']) {
    assert.equal((await fetch(`${providerOrigin}${route}`)).status, 404);
  }
});

test('the widget pages differ only in the widget script and the policy', async (t) => {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const page = (route) => fetch(`${origin}/demo/widget/${route}`);
  const escaped = await page('escaped');
  const policy = await page('policy');
  const notAllowed = await page('policy-not-allowed');
  for (const response of [escaped, policy]) {
    assert.equal(
      response.headers.get('content-security-policy'),
      "require-trusted-types-for 'script'",
    );
  }
  assert.equal(
    notAllowed.headers.get('content-security-policy'),
    "require-trusted-types-for 'script'; trusted-types shop-policy",
  );
  const policyHtml = await policy.text();
  assert.equal(policyHtml, await notAllowed.text());
  assert.equal(
    (await escaped.text()).replace('/widget-escaped.js', '/widget-policy.js'),
    policyHtml,
  );
  // The escaped widget still assigns a string to innerHTML. The policy
  // widget assigns the TrustedHTML from its html tag.
  const script = async (name) => (await fetch(`${origin}/${name}.js`)).text();
  assert.match(await script('widget-escaped'), /\.innerHTML = escapeHTML`/);
  assert.match(await script('widget-policy'), /\.innerHTML = html`/);
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
        {
          path: '/demo/widget/escaped',
          headers: { [csp]: "require-trusted-types-for 'script'" },
        },
        {
          path: '/demo/widget/policy',
          headers: { [csp]: "require-trusted-types-for 'script'" },
        },
        {
          path: '/demo/widget/policy-not-allowed',
          headers: {
            [csp]:
              "require-trusted-types-for 'script'; trusted-types shop-policy",
          },
        },
        { path: '/demo/embed/no-sandbox' },
        { path: '/demo/embed/no-top-navigation' },
        { path: '/demo/embed/user-activation' },
        { path: '/embed-config.js' },
        {
          path: '/demo/summary/permissive',
          headers: { [csp]: "script-src 'self' 'unsafe-eval'" },
        },
        {
          path: '/demo/summary/restricted',
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
        {
          path: '/demo/coop/host-coop',
          headers: { 'cross-origin-opener-policy': 'same-origin' },
        },
        { path: '/demo/coop/restricted' },
        { path: '/demo/broadcast/permissive' },
        {
          path: '/demo/broadcast/host-coop',
          headers: { 'cross-origin-opener-policy': 'same-origin' },
        },
        { path: '/demo/broadcast/restricted' },
        { path: '/demo/broadcast/callback' },
        { path: '/broadcast.js' },
        { path: '/callback.js' },
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
        { path: '/summary.js' },
        { path: '/profile.js' },
        { path: '/coop-config.js' },
        { path: '/' },
        { path: '/missing' },
        { path: '/provider.js' },
        { path: '/summary.html' },
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
        { path: '/embed' },
        { path: '/login/embed' },
        { path: '/reporting-popup' },
        { path: '/reporting-resource.js' },
        { path: '/provider.js' },
        { path: '/provider-config.js' },
        { path: '/missing' },
        { path: '/summary.js' },
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
