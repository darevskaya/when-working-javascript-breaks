import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './test/browser',
  use: {
    baseURL: 'http://127.0.0.1:4175',
    browserName: 'chromium',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm start',
    url: 'http://127.0.0.1:4175',
    env: { PORT: '4175', PROVIDER_PORT: '4176' },
  },
});
