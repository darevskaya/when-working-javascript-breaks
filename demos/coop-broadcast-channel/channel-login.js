// The same popup login as coop.js, without window references. The popup
// starts at the BFF on this origin, and the BFF runs the login with Orbit ID.
// At the end, Orbit ID sends the popup back to this origin, and a callback
// page posts "done" on a BroadcastChannel. A channel reaches every page of
// the same origin, so the message arrives with no window relationship.
// The message carries no secret. The token stays on the BFF server, and this
// page asks the BFF who signed in. See bff.js.
// The same fix in a real library, after OpenStreetMap added COOP:
// https://github.com/osmlab/osm-auth/pull/138
const button = document.querySelector('#sign-in');
const status = document.querySelector('#status');
const openResult = document.querySelector('#open-result');
const channel = new BroadcastChannel('orbit-login');
let waiting = false;

// The restricted page asks for the provider login that sends COOP.
const login = location.pathname.endsWith('/restricted')
  ? 'restricted'
  : 'permissive';

channel.addEventListener('message', async ({ data }) => {
  if (!waiting) return;
  if (data?.type === 'login-failed') {
    waiting = false;
    status.textContent = 'Login failed.';
    status.className = 'blocked';
    return;
  }
  if (data?.type !== 'login-complete') return;
  // Any page of this origin can post "done". Only the BFF knows if a session
  // exists, so ask it, and keep waiting if it has none.
  // The browser sends the HttpOnly session cookie. The X-CSRF header is the
  // BFF's defense against requests from other sites.
  const answer = await fetch('/bff/user', { headers: { 'X-CSRF': '1' } });
  const { user } = answer.ok ? await answer.json() : {};
  if (typeof user !== 'string') return;
  waiting = false;
  status.textContent = `Logged in as ${user}`;
});

button.addEventListener('click', () => {
  // noopener: the popup gets no window.opener, and this page gets no window
  // back. COOP then has no relationship left to cut. noreferrer: the popup's
  // first request carries no Referer header.
  // The cost: window.open() returns null even when the popup opens, so this
  // page cannot tell that a popup blocker stopped it.
  const popup = window.open(
    `/bff/login?login=${login}`,
    '_blank',
    'popup,width=500,height=600,noopener,noreferrer',
  );
  openResult.value = String(popup);
  waiting = true;
  status.className = '';
  status.textContent =
    'Waiting for login… If no window opened, allow popups and try again.';
});
