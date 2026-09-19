import { appOrigin } from '/orbit-login-config.js';

const button = document.querySelector('#complete-login');
const status = document.querySelector('#status');

// The COOP demo opens this login in a popup and gets the result back through
// window.opener.
function popupLogin() {
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
}

// The SDK frame on the embed pages sends the whole page here, and the
// BroadcastChannel pages open this login in a popup. Both give the address to
// return to, and the result goes back in that address, not through
// window.opener.
function redirectLogin(returnTo) {
  document.querySelector('#provider-intro').textContent =
    'You are now on Orbit ID. When you continue, Orbit ID sends you back to the site that sent you here.';
  status.textContent = 'Continue to return to the site.';
  if (location.pathname === '/login/redirect') {
    document.querySelector('#provider-connection').hidden = true;
  } else {
    document.querySelector('#opener-state').value =
      window.opener === null ? 'null' : 'present';
    document.querySelector('#connection-description').textContent =
      'This login does not need window.opener. It sends a one-time code back to the server of the app.';
  }

  button.addEventListener('click', () => {
    // The BFF login asks for a code with PKCE. The Orbit ID server issues the
    // code and checks the return address. See demos/coop-broadcast-channel/orbit-auth.js.
    if (new URLSearchParams(location.search).has('code_challenge')) {
      location.assign(`/login/approve${location.search}`);
      return;
    }
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
}

const returnTo = new URLSearchParams(location.search).get('return_to');
if (location.pathname === '/login/redirect' || returnTo !== null) {
  redirectLogin(returnTo);
} else {
  popupLogin();
}
