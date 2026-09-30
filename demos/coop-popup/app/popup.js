import { providerOrigin } from '/app-config.js';

const centered = (width, height) =>
  `width=${width},height=${height},` +
  `left=${Math.round(screenX + (outerWidth - width) / 2)},` +
  `top=${Math.round(screenY + (outerHeight - height) / 2)}`;

const button = document.querySelector('#sign-in');
const status = document.querySelector('#status');
const mode = document.querySelector('#mode');
let popup;

const withCoop = location.pathname.endsWith('/with-coop');
const loginPath = withCoop ? '/provider/login/with-coop' : '/provider/login/no-coop';

mode.textContent = withCoop
  ? 'Orbit ID sends Cross-Origin-Opener-Policy: same-origin. The callback cannot reach this page.'
  : 'Neither page sends Cross-Origin-Opener-Policy. The callback can reach this page.';

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
