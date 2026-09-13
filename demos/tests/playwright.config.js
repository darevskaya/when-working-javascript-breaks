import { defineConfig } from '@playwright/test';

// These presentation tests fail on purpose, so `npm test` does not run them.
// The ports are separate, so this demo never collides with `npm start`.
export default defineConfig({
  expect: { timeout: 2000 },
  use: { baseURL: 'http://127.0.0.1:4177', trace: 'off' },
  webServer: {
    command: 'node server.js',
    cwd: '../..',
    url: 'http://127.0.0.1:4177/demo/profile',
    env: { PORT: '4177', PROVIDER_PORT: '4178' },
    reuseExistingServer: true,
  },
});
