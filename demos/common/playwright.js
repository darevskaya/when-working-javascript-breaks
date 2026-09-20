import { defineConfig } from '@playwright/test';

// The Playwright configuration of one demo. It starts the demo's server.js on
// test ports, so a demo that you run by hand on its own port keeps working.
export function demoConfig(overrides = {}) {
  const base = {
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
  };
  // An override of use adds to the base use, so a caller keeps baseURL.
  return defineConfig({
    ...base,
    ...overrides,
    use: { ...base.use, ...overrides.use },
  });
}
