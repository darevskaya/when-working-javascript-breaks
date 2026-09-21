// The channel carries no credentials; the BFF holds the session.
const failed = new URLSearchParams(location.search).has('error');
const channel = new BroadcastChannel('orbit-login');
channel.postMessage({ type: failed ? 'login-failed' : 'login-complete' });
channel.close();
document.querySelector('#status').textContent = failed
  ? 'Login failed. You can close this window.'
  : 'Login complete. You can close this window.';
window.close();
