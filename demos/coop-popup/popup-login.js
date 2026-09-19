import { providerOrigin } from '/login-config.js';

const button = document.querySelector('#sign-in');
const status = document.querySelector('#status');
const closed = document.querySelector('#popup-closed');
let popup;
let poll;
let loggedIn = false;

// The restricted page opens the provider login that sends COOP.
const loginPath = location.pathname.endsWith('/coop-on-login')
  ? '/login/coop'
  : '/login/no-coop';

window.addEventListener('message', (event) => {
  if (
    event.origin !== providerOrigin ||
    event.source !== popup ||
    event.data?.type !== 'login-complete' ||
    typeof event.data.user !== 'string'
  )
    return;
  loggedIn = true;
  status.textContent = `Logged in as ${event.data.user}`;
});

button.addEventListener('click', () => {
  clearInterval(poll);
  if (popup && !popup.closed) popup.close();
  popup = window.open(
    `${providerOrigin}${loginPath}`,
    '_blank',
    'popup,width=500,height=600',
  );
  status.className = '';
  if (!popup) {
    closed.value = '—';
    status.textContent = 'Popup blocked. Allow popups and try again.';
    status.className = 'blocked';
    return;
  }
  loggedIn = false;
  status.textContent = 'Waiting for login…';
  closed.value = String(popup.closed);
  // A closed popup with no result looks like a cancel. Under COOP, the popup
  // is detached and reports closed while it is still open, so the SDK blames
  // the user.
  poll = setInterval(() => {
    closed.value = String(popup.closed);
    if (!popup.closed) return;
    clearInterval(poll);
    if (!loggedIn) status.textContent = 'Login canceled by the user.';
  }, 100);
});
