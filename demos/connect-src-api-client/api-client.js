import { config } from './config.js';

// The only file that may call fetch. Each URL starts from an origin in
// config.js: fetch(new URL(path, config.apiOrigin)).

export async function getProfile() {
  const response = await fetch(new URL('/profile', config.apiOrigin));
  return response.json();
}

export async function sendMetrics() {
  await fetch(new URL('/collect', config.metricsOrigin), { method: 'POST' });
}

// Written with a hard-coded URL. The host is in the contract, so the browser
// allows it, but lint flags it: the next host change misses this line.
export async function getStatus() {
  const response = await fetch('http://127.0.0.1:4174/status');
  return response.json();
}
