import { providerOrigin } from '/coop-config.js';

const controls = document.querySelector('#coop-controls');
const button = document.querySelector('#sign-in');
const status = document.querySelector('#status');
const closed = document.querySelector('#popup-closed');
let popup;
let poll;

function syncControls() {
  controls.elements.policy.value = location.pathname.endsWith('/restricted')
    ? 'restricted'
    : 'permissive';
}
syncControls();
window.addEventListener('pageshow', syncControls);
controls.addEventListener('change', () => {
  history.pushState(null, '', `/demo/coop/${controls.elements.policy.value}`);
});
window.addEventListener('popstate', syncControls);

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
    `${providerOrigin}/login/${controls.elements.policy.value}`,
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
