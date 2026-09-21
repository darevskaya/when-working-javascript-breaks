import { config } from './config.js';

// The one file that calls fetch. It names no origin, so every URL starts from
// config.js and no call can leave the contract.
const url = (path) => new URL(path, config.apiOrigin);

export async function getProfile() {
  const response = await fetch(url('/profile'));
  return response.json();
}

export async function getStatus() {
  const response = await fetch(url('/status'));
  return response.json();
}
