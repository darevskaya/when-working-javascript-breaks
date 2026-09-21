import { providerOrigin } from '/login-config.js';

const button = document.querySelector('#sign-in');
const status = document.querySelector('#status');
let popup;
let poll;
let loggedIn = false;

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
  button.hidden = true;
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
    status.textContent = 'Popup blocked. Allow popups and try again.';
    status.className = 'blocked';
    return;
  }
  loggedIn = false;
  status.textContent = 'Waiting for login…';
  // COOP reports closed before closure, causing a false cancellation.
  poll = setInterval(() => {
    if (!popup.closed) return;
    clearInterval(poll);
    if (!loggedIn) status.textContent = 'Login canceled by the user.';
  }, 100);
});
