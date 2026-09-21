import { demoConfig } from '../common/playwright.js';

// Three projects, one per npm script. The two policy projects run the same
// spec file against the same page. test/policy-projects.spec.js reads the csp
// and permissionsPolicy of the project and puts them on the response, so the
// headers are the only difference between the two runs.
//
// A policy with no worker directive falls back to child-src, then to
// script-src, so the strict project blocks the Blob worker without naming a
// worker directive at all.
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
