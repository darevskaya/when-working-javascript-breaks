import { providerOrigin } from '/coop-config.js';

const button = document.querySelector('#sign-in');
const status = document.querySelector('#status');
const closed = document.querySelector('#popup-closed');
let popup;
let poll;

// The restricted page opens the provider login that sends COOP.
const loginPath = location.pathname.endsWith('/restricted')
  ? '/login/restricted'
  : '/login/permissive';

window.addEventListener('message', (event) => {
  if (
    event.origin !== providerOrigin ||
    event.source !== popup ||
    event.data?.type !== 'login-complete' ||
    typeof event.data.user !== 'string'
  )
    return;
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
  status.textContent = 'Waiting for login…';
  closed.value = String(popup.closed);
  // Under COOP the popup is detached, so this stays false while it is open.
  poll = setInterval(() => {
    closed.value = String(popup.closed);
    if (popup.closed) clearInterval(poll);
  }, 100);
});
