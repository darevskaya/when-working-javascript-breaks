import globals from 'globals';

// new Worker(...), new window.Worker(...), new globalThis["Worker"](...)
const newWorker =
  'NewExpression:matches([callee.name=/^(Shared)?Worker$/],' +
  '[callee.property.name=/^(Shared)?Worker$/],' +
  '[callee.property.value=/^(Shared)?Worker$/])';

const workerMessage = 'Start a Worker from a script path, not a Blob URL.';

// Five rules, one subject: code that turns a string into running code.
export default [
  { ignores: ['dist/**', 'test-results/**', 'playwright-report/**'] },
  {
    files: ['**/*.js'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      'no-eval': ['error', { allowIndirect: false }],
      'no-implied-eval': 'error',
      'no-new-func': 'error'
      
      'no-restricted-syntax': [
        'error',
        // new Worker(workerURL)
        // new Worker(URL.createObjectURL(blob))
        // new Worker(flag ? '/worker.js' : URL.createObjectURL(blob))
        // new window.Worker(config.path)
        {
          selector: `${newWorker}:not([arguments.0.type='Literal'],[arguments.0.callee.name='URL'])`,
          message: workerMessage,
        },
        // new Worker('blob:abc123')
        // new Worker(`blob:${id}`)
        {
          selector: `${newWorker}[arguments.0.value=/^blob:/]`,
          message: workerMessage,
        },
      ],
    },
  },
];
