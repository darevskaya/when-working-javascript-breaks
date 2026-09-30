const user = new URLSearchParams(location.search).get('user');
const opener = window.opener;

if (opener && user) {
  opener.postMessage({ type: 'login-complete', user }, location.origin);
  window.close();
}
