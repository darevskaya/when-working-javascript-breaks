import { appOrigin } from '/provider-config.js';

const button = document.querySelector('#complete-login');
const status = document.querySelector('#status');

// COOP severs this reference, and with it the only way back to the app.
document.querySelector('#opener-state').value =
  window.opener === null ? 'null' : 'present';
document.querySelector('#connection-description').textContent =
  window.opener === null
    ? 'This window has no connection back to the app. The app cannot receive the login result.'
    : 'This window can send the login result back to the app.';

button.addEventListener('click', () => {
  if (window.opener === null) {
    status.textContent =
      'Login could not finish. The connection to the app is missing, so the app is still waiting. Close this window to try again.';
    status.className = 'blocked';
    return;
  }
  window.opener.postMessage(
    { type: 'login-complete', user: 'Elena' },
    appOrigin,
  );
  window.close();
});
