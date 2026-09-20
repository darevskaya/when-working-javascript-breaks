import { cspConfig } from './csp.config.js';

// The same page, without blob: in worker-src. The browser blocks the worker,
// the canvas stays empty, and the test fails with the violations attached.
export default cspConfig({
  name: 'strict',
  csp: "worker-src 'self'; script-src 'self'",
});
