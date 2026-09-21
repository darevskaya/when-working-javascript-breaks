import globals from 'globals';

// A Worker that starts from a Blob URL needs blob: in worker-src. Most
// customer policies do not have it, so lint names the line before the browser
// does. app.js breaks this rule on purpose, and npm run lint fails.
export default [
  { ignores: ['test-results/**', 'playwright-report/**'] },
  {
    files: ['**/*.js'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          // new Worker(blobUrl), new Worker(flag ? '/w.js' : blobUrl).
          // Allowed: new Worker('/worker.js'), new Worker(new URL(…)).
          selector:
            "NewExpression:matches([callee.name='Worker'],[callee.property.name='Worker'])" +
            ":not([arguments.0.type='Literal'],[arguments.0.callee.name='URL'])",
          message: 'Start a Worker from a script path, not a Blob URL.',
        },
      ],
    },
  },
];
