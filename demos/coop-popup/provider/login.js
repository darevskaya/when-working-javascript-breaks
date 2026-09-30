import { appOrigin } from '/provider-config.js';

const button = document.querySelector('#complete-login');

button.addEventListener('click', () => {
  const callback = new URL('/login/callback', appOrigin);
  callback.searchParams.set('user', 'Elena');
  location.assign(callback);
});
