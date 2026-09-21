// Same-origin channels survive COOP; tokens stay in bff.js.
const button = document.querySelector('#sign-in');
const status = document.querySelector('#status');
const openResult = document.querySelector('#open-result');
const channel = new BroadcastChannel('orbit-login');
let waiting = false;

const login = location.pathname.endsWith('/coop-on-login') ? 'coop' : 'no-coop';

channel.addEventListener('message', async ({ data }) => {
  if (!waiting) return;
  if (data?.type === 'login-failed') {
    waiting = false;
    status.textContent = 'Login failed.';
    status.className = 'blocked';
    return;
  }
  if (data?.type !== 'login-complete') return;
  // Any same-origin page can signal completion; verify the BFF session.
  const answer = await fetch('/bff/user', { headers: { 'X-CSRF': '1' } });
  const { user } = answer.ok ? await answer.json() : {};
  if (typeof user !== 'string') return;
  waiting = false;
  status.textContent = `Logged in as ${user}`;
  button.hidden = true;
});

button.addEventListener('click', () => {
  // noopener returns null even when the popup opens.
  const popup = window.open(
    `/bff/login?login=${login}`,
    '_blank',
    'popup,width=500,height=600,noopener,noreferrer',
  );
  openResult.value = String(popup);
  waiting = true;
  status.className = '';
  status.textContent =
    'Waiting for login… If no window opened, allow popups and try again.';
});
