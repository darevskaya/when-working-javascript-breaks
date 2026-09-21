import { createHash, randomBytes } from 'node:crypto';

// Only the BFF exchanges codes: client secret plus PKCE verifier.
// PKCE: https://www.rfc-editor.org/rfc/rfc7636

export const client = {
  id: 'fern-shop',
  secret: 'demo-secret-not-for-production',
};

const base64url = (buffer) => buffer.toString('base64url');
export const challengeFor = (verifier) =>
  base64url(createHash('sha256').update(verifier).digest());

async function readForm(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return new URLSearchParams(Buffer.concat(chunks).toString('utf8'));
}

function json(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(body));
}

export function createOrbitAuth({ appOrigin }) {
  const codes = new Map();

  function approve(request, response) {
    const params = new URL(request.url, 'http://localhost').searchParams;
    const returnTo = params.get('return_to');
    const redirect = URL.canParse(returnTo) ? new URL(returnTo) : null;
    const challenge = params.get('code_challenge');
    if (redirect?.origin !== appOrigin || !challenge || !params.get('state')) {
      response.writeHead(400);
      response.end('Unknown return address or missing PKCE challenge');
      return;
    }
    const code = base64url(randomBytes(24));
    codes.set(code, {
      challenge,
      redirectUri: `${redirect.origin}${redirect.pathname}`,
      user: 'Elena',
      expires: Date.now() + 60_000,
    });
    redirect.searchParams.set('code', code);
    redirect.searchParams.set('state', params.get('state'));
    response.writeHead(302, { Location: redirect.href });
    response.end();
  }

  async function token(request, response) {
    const form = await readForm(request);
    const entry = codes.get(form.get('code'));
    codes.delete(form.get('code'));
    if (
      request.method !== 'POST' ||
      form.get('client_id') !== client.id ||
      form.get('client_secret') !== client.secret ||
      !entry ||
      entry.expires < Date.now() ||
      entry.redirectUri !== form.get('redirect_uri') ||
      entry.challenge !== challengeFor(form.get('code_verifier') ?? '')
    ) {
      json(response, 400, { error: 'invalid_grant' });
      return;
    }
    // Demo shortcut: return the name directly.
    json(response, 200, {
      access_token: base64url(randomBytes(32)),
      token_type: 'Bearer',
      user: entry.user,
    });
  }

  return { approve, token };
}
