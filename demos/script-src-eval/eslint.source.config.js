import globals from 'globals';

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
