import { demoConfig } from '../common/playwright.js';

// The API server always uses port 4308, because config.js names it. Stop a
// demo that runs by hand before you run these tests.
export default demoConfig();
