import { demoConfig } from '../common/playwright.js';

// Deliberate failure: excluded from npm test; separate ports for live demos.
export default demoConfig({
  testDir: './stage',
  expect: { timeout: 2000 },
  use: { baseURL: 'http://127.0.0.1:4177', trace: 'off' },
  webServer: {
    command: 'node server.js',
    url: 'http://127.0.0.1:4177',
    env: { PORT: '4177', PROVIDER_PORT: '4178' },
    reuseExistingServer: true,
  },
});
