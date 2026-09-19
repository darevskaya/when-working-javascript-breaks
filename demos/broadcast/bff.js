import { randomBytes } from 'node:crypto';
import { client, challengeFor } from './orbit-auth.js';

// A minimal Backend for Frontend (BFF) for the BroadcastChannel login. The
// BFF is the OAuth client. It runs the authorization code flow with PKCE,
// keeps the token on the server, and gives the browser only an HttpOnly
// session cookie. The popup's channel message then carries no secret.
// RFC 10017, OAuth 2.0 for Browser-Based Applications, section 6.1:
// https://www.rfc-editor.org/rfc/rfc10017
// Duende BFF, one production implementation:
// https://docs.duendesoftware.com/bff/architecture/

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
  // RFC 10017 section 6.1.3.2 also asks for Secure and a __Host- name prefix.
  // Both need HTTPS, and most demos here run over HTTP.
  const secure = tls ? '; Secure' : '';
  const logins = new Map(); // state → { verifier, expires }
  const sessions = new Map(); // session id → { user, accessToken }

  // GET /bff/login?login=restricted. The popup starts here, on the app
  // origin. A new login ends the old session.
  function login(request, response) {
    const params = new URL(request.url, 'http://localhost').searchParams;
    sessions.delete(cookies(request).bff_session);
    const state = random();
    const verifier = random();
    logins.set(state, { verifier, expires: Date.now() + 300_000 });
    const origin = `${tls ? 'https' : 'http'}://${request.headers.host}`;
    const loginPath =
      params.get('login') === 'restricted'
        ? '/login/restricted'
        : '/login/permissive';
    const authorize = new URL(loginPath, providerOrigin);
    authorize.searchParams.set('return_to', `${origin}/bff/callback`);
    authorize.searchParams.set('state', state);
    authorize.searchParams.set('code_challenge', challengeFor(verifier));
    authorize.searchParams.set('code_challenge_method', 'S256');
    response.writeHead(302, {
      Location: authorize.href,
      // Binds the callback to the browser that started the login. Lax,
      // because Orbit ID sends the browser back with a top-level navigation.
      'Set-Cookie': [
        `bff_login=${state}; HttpOnly; SameSite=Lax; Path=/bff; Max-Age=300${secure}`,
        `bff_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure}`,
      ],
    });
    response.end();
  }

  // GET /bff/callback?code=…&state=…. Orbit ID sends the popup here. The BFF
  // exchanges the code on the server, then sends the popup to a page that
  // only says "done".
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
      ? '/demo/broadcast/callback'
      : '/demo/broadcast/callback?error=login_failed';
    response.writeHead(302, headers);
    response.end();
  }

  // GET /bff/user. The app page asks who is signed in. The browser sends the
  // session cookie. The token stays here. The X-CSRF header makes a
  // cross-origin request need a CORS preflight, which this server never
  // allows (RFC 10017 section 6.1.3.3.2).
  function user(request, response) {
    const session = sessions.get(cookies(request).bff_session);
    const status =
      request.headers['x-csrf'] !== '1' ? 403 : session ? 200 : 401;
    response.writeHead(status, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify(status === 200 ? { user: session.user } : {}));
  }

  return { login, callback, user };
}
