import { providerOrigin } from '/frame-config.js';

// The SDK loader on the customer's page. It gives the Orbit ID frame the
// address to return to after login. When Orbit ID sends the user back, the
// URL of this page carries the user, and the loader passes it to the frame.
// Returns the signed-in user, or null.
export function embedOrbitFrame(iframe) {
  const url = new URL(location.href);
  const user = url.searchParams.get('orbit_user');
  url.searchParams.delete('orbit_user');
  history.replaceState(null, '', url);

  const src = new URL('/frame', providerOrigin);
  src.searchParams.set('return_to', url.href);
  if (user) src.searchParams.set('user', user);
  iframe.src = src.href;
  return user;
}
