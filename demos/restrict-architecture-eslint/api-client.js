import { config } from './config.js';

const url = (path) => new URL(path, config.apiOrigin);

export async function getProfile() {
  const response = await fetch(url('/profile'));
  return response.json();
}

export async function getStatus() {
  const response = await fetch(url('/status'));
  return response.json();
}
