import { cspConfig } from './csp.config.js';

// blob: is in worker-src, so the Blob worker starts and the test passes.
export default cspConfig({
  name: 'permissive',
  csp: "worker-src 'self' blob:; script-src 'self'",
});
