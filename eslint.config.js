import globals from 'globals';

// new Worker(...), new window.Worker(...), new globalThis["Worker"](...)
const newWorker =
  'NewExpression:matches([callee.name=/^(Shared)?Worker$/],' +
  '[callee.property.name=/^(Shared)?Worker$/],' +
  '[callee.property.value=/^(Shared)?Worker$/])';

const workerMessage = 'Start a Worker from a script path, not a Blob URL.';

// new Worker(workerURL)
// new Worker(URL.createObjectURL(blob))
// new Worker(flag ? '/worker.js' : URL.createObjectURL(blob))
// new window.Worker(config.path)
// new Worker('blob:abc123')
// new Worker(`blob:${id}`)
const blobWorker = [
  {
    selector: `${newWorker}:not([arguments.0.type='Literal'],[arguments.0.callee.name='URL'])`,
    message: workerMessage,
  },
  {
    selector: `${newWorker}[arguments.0.value=/^blob:/]`,
    message: workerMessage,
  },
];

// Any new Worker, with any argument. Only the factory file may start one.
const workerOutsideFactory = {
  selector: newWorker,
  message: 'Start a Worker through workerFactory() in worker-factory.js.',
};

// Five rules find code that turns a string into running code. One more rule
// keeps every Worker in workerFactory(), so one file holds the Blob worker.
export default [
  { ignores: ['dist/**', 'test-results/**', 'playwright-report/**'] },
  {
    files: ['**/*.js'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      'no-eval': ['error', { allowIndirect: false }],
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-restricted-syntax': ['error', ...blobWorker, workerOutsideFactory],
    },
  },
  // The factory may start a Worker. The Blob URL rules still apply here.
  {
    files: ['demos/fractal/worker-factory.js'],
    rules: { 'no-restricted-syntax': ['error', ...blobWorker] },
  },
];
