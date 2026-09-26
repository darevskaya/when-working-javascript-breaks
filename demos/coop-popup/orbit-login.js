import { appOrigin } from '/orbit-login-config.js';

const button = document.querySelector('#complete-login');

button.addEventListener('click', () => {
  // Redirect to the registered callback on the app origin.
  const callback = new URL('/login/callback', appOrigin);
  callback.searchParams.set('user', 'Elena');
  location.assign(callback);
});
