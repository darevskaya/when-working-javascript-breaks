import { config } from './config.js';

export async function getProfile() {
  const response = await fetch(new URL('/profile', config.apiOrigin));
  return response.json();
}

export async function sendMetrics() {
  await fetch(new URL('/collect', config.metricsOrigin), { method: 'POST' });
}

export async function getStatus() {
  const response = await fetch('http://127.0.0.1:4308/status');
  return response.json();
}
