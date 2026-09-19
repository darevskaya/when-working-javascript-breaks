import globals from 'globals';

// This demo has no policy rule. The browser reports the violations at run
// time, which is what the demo shows. Lint checks only the JavaScript itself.
export default [
  { ignores: ['test-results/**', 'playwright-report/**', 'logs/**'] },
  {
    files: ['**/*.js'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
];
