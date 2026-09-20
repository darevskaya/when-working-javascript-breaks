import { demoConfig } from '../common/playwright.js';

// The stage test fails on purpose, so npm test does not run it. It uses its
// own ports, so it never collides with a demo that runs by hand.
export default demoConfig({
  testDir: './stage',
  expect: { timeout: 2000 },
  use: { baseURL: 'http://127.0.0.1:4177', trace: 'off' },
  webServer: {
    command: 'node server.js',
    url: 'http://127.0.0.1:4177/demo/connect-src',
    env: { PORT: '4177', PROVIDER_PORT: '4178' },
    reuseExistingServer: true,
  },
});
