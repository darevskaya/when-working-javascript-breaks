import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, createProviderServer } from '../server.js';
import { client, challengeFor } from '../demos/common/orbit-auth.js';

async function listen(server, t) {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  return `http://127.0.0.1:${server.address().port}`;
}

test('Orbit ID exchanges a code once, and only with the right PKCE verifier', async (t) => {
  const appOrigin = 'http://127.0.0.1:4998';
  const provider = await listen(createProviderServer({ appOrigin }), t);
  const verifier = 'a-verifier-that-only-the-bff-knows';
  const redirectUri = `${appOrigin}/bff/callback`;

  async function approve(returnTo = redirectUri) {
    const url = new URL('/login/approve', provider);
    url.searchParams.set('return_to', returnTo);
    url.searchParams.set('state', 'state-1');
    url.searchParams.set('code_challenge', challengeFor(verifier));
    return fetch(url, { redirect: 'manual' });
  }
  const token = (code, codeVerifier = verifier) =>
    fetch(`${provider}/token`, {
      method: 'POST',
      body: new URLSearchParams({
        code,
        code_verifier: codeVerifier,
        redirect_uri: redirectUri,
        client_id: client.id,
        client_secret: client.secret,
      }),
    });

  // The code goes only to the app origin.
  assert.equal((await approve('https://attacker.example/cb')).status, 400);
  const approved = await approve();
  assert.equal(approved.status, 302);
  const back = new URL(approved.headers.get('location'));
  assert.equal(`${back.origin}${back.pathname}`, redirectUri);
  assert.equal(back.searchParams.get('state'), 'state-1');
  const code = back.searchParams.get('code');

  // A stolen code is useless without the verifier, and the attempt burns it.
  assert.equal((await token(code, 'a-guess')).status, 400);
  assert.equal((await token(code)).status, 400);

  const second = new URL((await approve()).headers.get('location'));
  const answer = await token(second.searchParams.get('code'));
  assert.equal(answer.status, 200);
  assert.equal((await answer.json()).user, 'Elena');
  // Each code works once.
  assert.equal((await token(second.searchParams.get('code'))).status, 400);
});

test('the BFF starts a login and rejects a callback it did not start', async (t) => {
  const app = await listen(
    createServer({ providerOrigin: 'http://127.0.0.1:4999' }),
    t,
  );
  const login = await fetch(`${app}/bff/login?login=restricted`, {
    redirect: 'manual',
  });
  assert.equal(login.status, 302);
  const authorize = new URL(login.headers.get('location'));
  assert.equal(authorize.origin, 'http://127.0.0.1:4999');
  assert.equal(authorize.pathname, '/login/restricted');
  assert.equal(authorize.searchParams.get('code_challenge_method'), 'S256');
  assert.equal(authorize.searchParams.get('return_to'), `${app}/bff/callback`);
  // The verifier stays on the server. Only its hash leaves.
  assert.ok(!login.headers.get('location').includes('verifier'));
  const cookies = login.headers.getSetCookie();
  assert.ok(cookies.some((cookie) => /^bff_login=.+HttpOnly/.test(cookie)));

  // A callback without the login cookie is not this browser's login.
  const state = authorize.searchParams.get('state');
  const callback = await fetch(
    `${app}/bff/callback?code=x&state=${encodeURIComponent(state)}`,
    { redirect: 'manual' },
  );
  assert.equal(
    callback.headers.get('location'),
    '/demo/broadcast/callback?error=login_failed',
  );
  assert.ok(
    !callback.headers.getSetCookie().some((c) => /^bff_session=\w/.test(c)),
  );
});
