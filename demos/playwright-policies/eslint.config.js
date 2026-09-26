import globals from 'globals';

// worker.js intentionally fails lint: Blob workers need worker-src blob:.
export default [
  { ignores: ['test-results/**', 'playwright-report/**'] },
  {
    files: ['**/*.js'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          // Allow literal paths and new URL(); flag other arguments.
          selector:
            "NewExpression:matches([callee.name='Worker'],[callee.property.name='Worker'])" +
            ":not([arguments.0.type='Literal'],[arguments.0.callee.name='URL'])",
          message: 'Start a Worker from a script path, not a Blob URL.',
        },
      ],
    },
  },
];
