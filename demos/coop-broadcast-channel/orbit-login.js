// The BFF opens this login with a PKCE challenge in the address. Orbit ID
// issues a one-time code and sends the browser back to the BFF, so the login
// needs no window.opener. See orbit-auth.js for the code and the token.
const button = document.querySelector('#complete-login');

button.addEventListener('click', () => {
  // The Orbit ID server issues the code and checks the return address.
  location.assign(`/login/approve${location.search}`);
});
