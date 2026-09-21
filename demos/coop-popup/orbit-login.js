import { appOrigin } from '/orbit-login-config.js';

const button = document.querySelector('#complete-login');

document.querySelector('#opener-state').value =
  window.opener === null ? 'null' : 'present';
document.querySelector('#connection-description').textContent =
  window.opener === null
    ? 'This window has no connection back to the app. The app cannot receive the login result.'
    : 'This window can send the login result back to the app.';

button.addEventListener('click', () => {
  // COOP drops the result, but the popup still closes.
  window.opener?.postMessage(
    { type: 'login-complete', user: 'Elena' },
    appOrigin,
  );
  window.close();
});
