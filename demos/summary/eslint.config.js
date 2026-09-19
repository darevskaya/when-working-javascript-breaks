import globals from 'globals';

// The rules for this demo: code that turns a string into running code.
// script-src without 'unsafe-eval' blocks all three forms.
export default [
  { ignores: ['test-results/**', 'playwright-report/**'] },
  {
    files: ['**/*.js'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      'no-eval': ['error', { allowIndirect: false }],
      'no-implied-eval': 'error',
      'no-new-func': 'error',
    },
  },
];
