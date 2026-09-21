import { appOrigin } from '/orbit-login-config.js';

// The login sends its result back through window.opener. COOP severs that
// reference, and with it the only way back to the app.
const button = document.querySelector('#complete-login');

document.querySelector('#opener-state').value =
  window.opener === null ? 'null' : 'present';
document.querySelector('#connection-description').textContent =
  window.opener === null
    ? 'This window has no connection back to the app. The app cannot receive the login result.'
    : 'This window can send the login result back to the app.';

button.addEventListener('click', () => {
  // With no opener the message goes nowhere. The window closes either way, so
  // the person sees a finished login, and the app never learns the result.
  window.opener?.postMessage(
    { type: 'login-complete', user: 'Elena' },
    appOrigin,
  );
  window.close();
});
