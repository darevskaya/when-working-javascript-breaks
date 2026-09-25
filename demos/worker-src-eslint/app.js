import { config } from './config.js';
import { total, status } from './worker-client.js';

document.querySelector('#script').textContent = config.workerScript;

async function show(id, call) {
  const output = document.querySelector(id);
  try {
    output.textContent = await call();
  } catch (error) {
    output.textContent = `Blocked (${error.message})`;
    output.className = 'blocked';
  }
}

show('#total', async () => `Total: ${await total([19.99, 4.5, 18.01])}`);
show('#status', () => status());
