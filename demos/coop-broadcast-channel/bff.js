import { randomBytes } from 'node:crypto';
import { client, challengeFor } from './orbit-auth.js';

// The BFF keeps tokens server-side; the browser gets an HttpOnly session.
// https://www.rfc-editor.org/rfc/rfc10017#section-6.1

const random = () => randomBytes(32).toString('base64url');

function cookies(request) {
  return Object.fromEntries(
    (request.headers.cookie ?? '')
      .split(';')
      .map((part) => part.trim().split('='))
      .filter(([name, value]) => name && value),
  );
}

export function createBff({ providerOrigin, tls }) {
  // HTTP demo cookies omit Secure and the __Host- prefix.
  const secure = tls ? '; Secure' : '';
  const logins = new Map();
  const sessions = new Map();

  function login(request, response) {
    const params = new URL(request.url, 'http://localhost').searchParams;
    sessions.delete(cookies(request).bff_session);
    const state = random();
    const verifier = random();
    logins.set(state, { verifier, expires: Date.now() + 300_000 });
    const origin = `${tls ? 'https' : 'http'}://${request.headers.host}`;
    // Version 2 of the Orbit ID login sends Cross-Origin-Opener-Policy.
    const loginPath =
      params.get('login') === 'coop'
        ? '/provider/login/v2'
        : '/provider/login/v1';
    const authorize = new URL(loginPath, providerOrigin);
    authorize.searchParams.set('return_to', `${origin}/bff/callback`);
    authorize.searchParams.set('state', state);
    authorize.searchParams.set('code_challenge', challengeFor(verifier));
    authorize.searchParams.set('code_challenge_method', 'S256');
    response.writeHead(302, {
      Location: authorize.href,
      // Lax allows the provider redirect while binding login to this browser.
      'Set-Cookie': [
        `bff_login=${state}; HttpOnly; SameSite=Lax; Path=/bff; Max-Age=300${secure}`,
        `bff_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure}`,
      ],
    });
    response.end();
  }

  async function callback(request, response) {
    const url = new URL(request.url, 'http://localhost');
    const state = url.searchParams.get('state');
    const pending = logins.get(state);
    logins.delete(state);
    let result = null;
    if (
      pending &&
      pending.expires > Date.now() &&
      cookies(request).bff_login === state
    ) {
      const origin = `${tls ? 'https' : 'http'}://${request.headers.host}`;
      const answer = await fetch(new URL('/token', providerOrigin), {
        method: 'POST',
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: url.searchParams.get('code') ?? '',
          code_verifier: pending.verifier,
          redirect_uri: `${origin}/bff/callback`,
          client_id: client.id,
          client_secret: client.secret,
        }),
      }).catch(() => null);
      if (answer?.ok) result = await answer.json();
    }
    const headers = {
      'Set-Cookie': [
        `bff_login=; HttpOnly; SameSite=Lax; Path=/bff; Max-Age=0${secure}`,
      ],
    };
    if (result) {
      const id = random();
      sessions.set(id, { user: result.user, accessToken: result.access_token });
      headers['Set-Cookie'].push(
        `bff_session=${id}; HttpOnly; SameSite=Strict; Path=/${secure}`,
      );
    }
    headers.Location = result
      ? '/demo/coop-broadcast-channel/callback'
      : '/demo/coop-broadcast-channel/callback?error=login_failed';
    response.writeHead(302, headers);
    response.end();
  }

  // X-CSRF forces cross-origin preflights, which this server rejects.
  function user(request, response) {
    const session = sessions.get(cookies(request).bff_session);
    const status =
      request.headers['x-csrf'] !== '1' ? 403 : session ? 200 : 401;
    response.writeHead(status, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify(status === 200 ? { user: session.user } : {}));
  }

  return { login, callback, user };
}
