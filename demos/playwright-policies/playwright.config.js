import { demoConfig } from '../common/playwright.js';

// Headed runs slow down each action and keep the browser open at the end
// so that you can follow the demo. Workers inherit the variables.
if (process.argv.includes('--headed')) {
  process.env.SLOW_MO ??= '1000';
  process.env.END_PAUSE ??= '5000';
}
const launchOptions = { slowMo: Number(process.env.SLOW_MO ?? 0) };

export default demoConfig({
  reporter: [['list'], ['html', { open: 'never' }]],
  projects: [
    {
      name: 'permissive',
      testMatch: 'policy-projects.spec.js',
      use: {
        csp: "script-src 'self'; worker-src 'self' blob:",
        screenshot: 'only-on-failure',
        launchOptions,
      },
    },
    {
      name: 'strict',
      testMatch: 'policy-projects.spec.js',
      use: {
        csp: "script-src 'self'; frame-ancestors 'none'",
        screenshot: 'only-on-failure',
        launchOptions,
      },
    },
  ],
});
