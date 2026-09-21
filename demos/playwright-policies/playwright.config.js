import { demoConfig } from '../common/playwright.js';

export default demoConfig({
  reporter: [['list'], ['html', { open: 'never' }]],
  projects: [
    { name: 'demo', testMatch: 'demo.spec.js' },
    {
      name: 'permissive',
      testMatch: 'policy-projects.spec.js',
      use: {
        csp: "script-src 'self'; worker-src 'self' blob:",
        permissionsPolicy: 'geolocation=(self)',
        screenshot: 'only-on-failure',
      },
    },
    {
      name: 'strict',
      testMatch: 'policy-projects.spec.js',
      use: {
        csp: "script-src 'self'",
        permissionsPolicy: 'geolocation=()',
        screenshot: 'only-on-failure',
      },
    },
  ],
});
