import { appOrigin } from '/orbit-login-config.js';

const button = document.querySelector('#complete-login');

button.addEventListener('click', () => {
  // Under COOP there is no opener, so the popup stays open.
  const opener = window.opener;
  if (!opener) return;
  opener.postMessage({ type: 'login-complete', user: 'Elena' }, appOrigin);
  window.close();
});
