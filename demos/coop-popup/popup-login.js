import { providerOrigin } from '/login-config.js';

// Center the popup over the app window.
const centered = (width, height) =>
  `width=${width},height=${height},` +
  `left=${Math.round(screenX + (outerWidth - width) / 2)},` +
  `top=${Math.round(screenY + (outerHeight - height) / 2)}`;

const button = document.querySelector('#sign-in');
const status = document.querySelector('#status');
let popup;

// Version 2 of the Orbit ID login sends Cross-Origin-Opener-Policy.
const loginPath = location.pathname.endsWith('/coop-on-login')
  ? '/provider/login/v2'
  : '/provider/login/v1';

window.addEventListener('message', (event) => {
  if (
    event.origin !== location.origin ||
    event.source !== popup ||
    event.data?.type !== 'login-complete' ||
    typeof event.data.user !== 'string'
  )
    return;
  status.textContent = `Logged in as ${event.data.user}`;
  button.hidden = true;
});

button.addEventListener('click', () => {
  if (popup && !popup.closed) popup.close();
  popup = window.open(
    `${providerOrigin}${loginPath}`,
    '_blank',
    `popup,${centered(500, 600)}`,
  );
  status.className = '';
  if (!popup) {
    status.textContent = 'Popup blocked. Allow popups and try again.';
    status.className = 'blocked';
    return;
  }
  status.textContent = 'Waiting for login…';
});
