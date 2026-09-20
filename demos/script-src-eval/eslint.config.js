import globals from 'globals';

export default [
  { ignores: ['dist/**', 'test-results/**', 'playwright-report/**'] },
  {
    files: ['**/*.js'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      'no-eval': ['error', { allowIndirect: false }],
      'no-implied-eval': 'error',
      'no-new-func': 'error',

      
      'no-restricted-syntax': [
        'error',
        {
          // devtool: 'eval-source-map', devtool: 'eval'. Each one wraps every
          // module of the bundle in eval().
          selector: "Property[key.name='devtool'][value.value=/^eval/]",
          message:
            "This devtool wraps every module in eval(), and script-src without 'unsafe-eval' blocks the bundle. Use devtool: 'source-map'.",
        },
      ],
    },
  },
];
