import globals from 'globals';
import noUnsanitized from 'eslint-plugin-no-unsanitized';

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

// el.innerHTML = markup, el.innerHTML += markup, el['innerHTML'] = markup
// Under require-trusted-types-for 'script', each one throws a TypeError, even
// with a constant string. eslint-plugin-no-unsanitized allows constant
// strings, because they are not an XSS risk, so this rule stays.
const innerHTML = {
  selector:
    "AssignmentExpression:matches([left.property.name='innerHTML'],[left.property.value='innerHTML'])",
  message: 'Build markup with DOM APIs and textContent, not innerHTML.',
};

// Any new Worker, with any argument. Only the factory file may start one.
const workerOutsideFactory = {
  selector: newWorker,
  message: 'Start a Worker through workerFactory() in worker-factory.js.',
};

// Six rules find code that turns a string into running code or markup. One
// more rule keeps every Worker in workerFactory(), so one file holds the Blob
// worker. eslint-plugin-no-unsanitized adds two rules for markup sinks that
// the innerHTML rule does not see: outerHTML, insertAdjacentHTML(), and
// document.write().
export default [
  { ignores: ['dist/**', 'test-results/**', 'playwright-report/**'] },
  noUnsanitized.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      'no-eval': ['error', { allowIndirect: false }],
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-restricted-syntax': [
        'error',
        ...blobWorker,
        innerHTML,
        workerOutsideFactory,
      ],
    },
  },
  // The factory may start a Worker. The Blob URL rules still apply here.
  {
    files: ['demos/fractal/worker-factory.js'],
    rules: { 'no-restricted-syntax': ['error', ...blobWorker, innerHTML] },
  },
];
