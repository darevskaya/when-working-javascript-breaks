import { demoConfig } from '../common/playwright.js';

// Three projects, one per npm script. The two CSP projects run the same file
// with a different policy, which test/csp-headers.spec.js puts on the
// response. A policy without worker-src falls back to child-src, then to
// script-src, so the strict policy blocks the Blob worker without a worker
// directive.
export default demoConfig({
  reporter: [['list'], ['html', { open: 'never' }]],
  projects: [
    { name: 'demo', testMatch: 'worker-src-blob.spec.js' },
    {
      name: 'permissive',
      testMatch: 'csp-headers.spec.js',
      use: {
        csp: "script-src 'self'; worker-src 'self' blob:",
        screenshot: 'only-on-failure',
      },
    },
    {
      name: 'strict',
      testMatch: 'csp-headers.spec.js',
      use: { csp: "script-src 'self'", screenshot: 'only-on-failure' },
    },
  ],
});
