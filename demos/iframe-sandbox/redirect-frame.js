// The Orbit ID frame. The login is a redirect: the frame navigates the whole
// page to Orbit ID, and Orbit ID sends the user back to the shop. The frame
// and the shop exchange no messages. The shop gives the frame its return
// address and the signed-in user in the frame URL.
const params = new URLSearchParams(location.search);
const returnTo = params.get('return_to');
const user = params.get('user');

const title = document.querySelector('#frame-title');
const status = document.querySelector('#status');
const signIn = document.querySelector('#sign-in');

signIn.addEventListener('click', () => {
  const login = new URL('/login/redirect', location.origin);
  login.searchParams.set('return_to', returnTo);
  status.textContent = 'Opening Orbit ID…';
  // A sandbox without allow-top-navigation or
  // allow-top-navigation-by-user-activation throws a SecurityError here.
  // The error stays in this frame. The shop page sees nothing.
  window.top.location.href = login.href;
});

if (user) {
  title.textContent = `Signed in as ${user}`;
  status.textContent = 'Orbit ID sent you back to the shop.';
  signIn.hidden = true;
}
