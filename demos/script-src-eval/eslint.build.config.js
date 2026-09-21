// Lint 2 of 3: eval in the bundle that webpack writes.
// Run it with: npm run lint:build
//
// The bundled source has no eval, because webpack swaps clean-renderer.js in
// for renderer.js. The devtool puts eval back, one call per module, and this
// lint finds it in dist/app.js. Build the bundle first.
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
