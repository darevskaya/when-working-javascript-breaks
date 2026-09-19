// The BFF sends the popup here after it exchanged the code on the server.
// This page has no code and no token. It only tells the app page, which
// needs no window reference to hear it, that the login ended.
const failed = new URLSearchParams(location.search).has('error');
const channel = new BroadcastChannel('orbit-login');
channel.postMessage({ type: failed ? 'login-failed' : 'login-complete' });
channel.close();
document.querySelector('#status').textContent = failed
  ? 'Login failed. You can close this window.'
  : 'Login complete. You can close this window.';
window.close();
