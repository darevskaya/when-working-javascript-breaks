import globals from 'globals';

// Lint 1 of 3: eval in the source you write.
// Run it with: npm run lint:source
//
// It flags the eval in renderer.js. script-src without 'unsafe-eval' blocks
// that call in the browser, so the page keeps its raw {{ … }} text.
export default [
  {
    ignores: [
      'dist/**',
      'webpack.config.js',
      'test-results/**',
      'playwright-report/**',
    ],
  },
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
