import { demoConfig } from '../common/playwright.js';

// One Playwright configuration per policy. The tests in test-csp/ read the
// policy from project.use.csp and put it on the response, so the two runs
// differ in the header and in nothing else.
export function cspConfig({ name, csp }) {
  return demoConfig({
    testDir: './test-csp',
    outputDir: `test-results/${name}`,
    reporter: [
      ['list'],
      ['html', { outputFolder: `playwright-report/${name}`, open: 'never' }],
    ],
    use: { screenshot: 'only-on-failure', trace: 'retain-on-failure' },
    projects: [{ name, use: { csp } }],
  });
}
