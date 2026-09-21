// Build first; this catches eval added by webpack.
export default [
  {
    files: ['**/*.js'],
    languageOptions: { sourceType: 'script' },
    rules: {
      'no-eval': ['error', { allowIndirect: false }],
      'no-implied-eval': 'error',
      'no-new-func': 'error',
    },
  },
];
