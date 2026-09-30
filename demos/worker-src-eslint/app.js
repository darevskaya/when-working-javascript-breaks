import { config } from './config.js';
import { total, status } from './worker-client.js';

document.querySelector('#script').textContent = config.workerScript;

async function showTotal() {
  const output = document.querySelector('#total');
  try {
    output.textContent = `Total: ${await total([19.99, 4.5, 18.01])}`;
  } catch (error) {
    output.textContent = `Blocked (${error.message})`;
    output.className = 'blocked';
  }
}

async function showStatus() {
  const output = document.querySelector('#status');
  try {
    output.textContent = await status();
  } catch (error) {
    output.textContent = `Blocked (${error.message})`;
    output.className = 'blocked';
  }
}

showTotal();
showStatus();
