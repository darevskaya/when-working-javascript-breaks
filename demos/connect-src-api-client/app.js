import { getProfile, sendMetrics, getStatus } from './api-client.js';

// Runs each API call and shows its result in its row.
async function show(id, call) {
  const output = document.querySelector(id);
  try {
    output.textContent = await call();
  } catch (error) {
    output.textContent = `Blocked (${error.name})`;
    output.className = 'blocked';
  }
}

show('#profile', async () => `Loaded: ${(await getProfile()).name}`);
show('#metrics', async () => {
  await sendMetrics();
  return 'Sent';
});
show('#status-check', async () => (await getStatus()).status);
// A direct call that skips the API client. Lint flags it.
show('#ping', async () => {
  await fetch('https://metrics.example.net/ping');
  return 'Sent';
});
