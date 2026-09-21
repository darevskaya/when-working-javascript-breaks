import { defineConfig } from '@playwright/test';

// Separate test ports let manually started demos keep running.
export function demoConfig(overrides = {}) {
  return defineConfig({
    testDir: './test',
    testMatch: '*.spec.js',
    use: {
      baseURL: 'http://127.0.0.1:4175',
      browserName: 'chromium',
      trace: 'retain-on-failure',
    },
    webServer: {
      command: 'node server.js',
      url: 'http://127.0.0.1:4175',
      env: { PORT: '4175', PROVIDER_PORT: '4176' },
    },
    ...overrides,
  });
}
