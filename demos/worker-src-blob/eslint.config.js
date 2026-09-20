import globals from 'globals';

// worker-src without blob: blocks a Worker from a Blob URL. One more rule
// keeps every Worker in workerFactory(), so one file holds the Blob worker.
export default [
  { ignores: ['test-results/**', 'playwright-report/**'] },
  {
    files: ['**/*.js'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          // new Worker(workerURL), new Worker(flag ? '/w.js' : blobURL)
          // Allowed: new Worker('/worker.js'), new Worker(new URL(...))
          selector:
            "NewExpression:matches([callee.name='Worker'],[callee.property.name='Worker'])" +
            ":not([arguments.0.type='Literal'],[arguments.0.callee.name='URL'])",
          message: 'Start a Worker from a script path, not a Blob URL.',
        },
        {
          // new Worker('blob:abc123')
          selector:
            "NewExpression:matches([callee.name='Worker'],[callee.property.name='Worker'])" +
            '[arguments.0.value=/^blob:/]',
          message: 'Start a Worker from a script path, not a Blob URL.',
        },
        {
          // Any new Worker. Only worker-factory.js may start one.
          selector:
            "NewExpression:matches([callee.name='Worker'],[callee.property.name='Worker'])",
          message:
            'Start a Worker through workerFactory() in worker-factory.js.',
        },
      ],
    },
  },
  // The factory may start a Worker. The Blob URL rules still apply here.
  {
    files: ['worker-factory.js'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "NewExpression:matches([callee.name='Worker'],[callee.property.name='Worker'])" +
            ":not([arguments.0.type='Literal'],[arguments.0.callee.name='URL'])",
          message: 'Start a Worker from a script path, not a Blob URL.',
        },
        {
          selector:
            "NewExpression:matches([callee.name='Worker'],[callee.property.name='Worker'])" +
            '[arguments.0.value=/^blob:/]',
          message: 'Start a Worker from a script path, not a Blob URL.',
        },
      ],
    },
  },
];
