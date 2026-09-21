import globals from 'globals';

export default [
  { ignores: ['test-results/**', 'playwright-report/**', 'logs/**'] },
  {
    files: ['**/*.js'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
];
