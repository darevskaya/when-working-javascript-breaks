import { demoConfig } from '../common/playwright.js';

// The API always listens on the port inside config.apiOrigin, so stop a demo
// that runs by hand before you run these tests.
export default demoConfig();
