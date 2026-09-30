import globals from 'globals';

const noWorker = {
  selector:
    "NewExpression:matches([callee.name='Worker'],[callee.name='SharedWorker'],[callee.property.name='Worker'])",
  message: 'Create workers through worker-factory.js.',
};

const noWorkerUrl = {
  selector: "NewExpression[callee.name='URL']",
  message: 'Create worker URLs in worker-factory.js.',
};

export default [
  { ignores: ['test-results/**', 'playwright-report/**'] },
  {
    files: ['**/*.js'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },

  {
    files: ['**/*.js'],
    rules: {
      'no-restricted-syntax': ['error', noWorker, noWorkerUrl],
    },
  },
  {
    files: ['worker-factory.js'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
];
