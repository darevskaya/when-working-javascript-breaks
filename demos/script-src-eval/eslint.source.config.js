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
      'no-new-func': 'error', // new Function()
      'no-implied-eval': 'error' // setTimeout("alert('hi')", 1000)
    },
  },
];
