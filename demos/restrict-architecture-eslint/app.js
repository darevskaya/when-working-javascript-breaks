import { config } from './config.js';
import { getProfile, getStatus } from './api-client.js';

// The page code. It calls no fetch and it names no origin, so it stays inside
// the contract without knowing what the contract is. Lint keeps it that way,
// and this file has no lint finding.

document.querySelector('#origins').textContent =
  Object.values(config).join(' ');

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
show('#status', async () => (await getStatus()).status);
