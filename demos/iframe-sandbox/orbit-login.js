import { appOrigin } from '/orbit-login-config.js';

// The frame sends the whole page here, with the address to return to. The
// result goes back in that address, not through window.opener.
const button = document.querySelector('#complete-login');
const status = document.querySelector('#status');
const returnTo = new URLSearchParams(location.search).get('return_to');

button.addEventListener('click', () => {
  // Send the user back only to the app origin, never to any address.
  const back = URL.canParse(returnTo) ? new URL(returnTo) : null;
  if (back?.origin !== appOrigin) {
    status.textContent =
      'Login could not finish. The return address is not allowed.';
    status.className = 'blocked';
    return;
  }
  back.searchParams.set('orbit_user', 'Elena');
  location.assign(back);
});
