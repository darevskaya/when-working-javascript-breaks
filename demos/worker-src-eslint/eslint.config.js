import globals from 'globals';
import { config } from './config.js';

// One block per file. Overlapping blocks would replace the rule options.
const noWorker = {
  selector:
    "NewExpression:matches([callee.name='Worker'],[callee.name='SharedWorker'],[callee.property.name='Worker'])",
  message: 'Start the worker through worker-client.js.',
};

const noBlob = {
  selector:
    "NewExpression[callee.name='Blob'], CallExpression[callee.property.name='createObjectURL']",
  message: 'Start a Worker from a script path, not a Blob URL.',
};

const scriptPath = 'Literal[value=/\\.js$/]:not(ImportDeclaration > *)';

const noScriptPath = {
  selector: `${scriptPath}, TemplateElement[value.raw=/\\.js$/]`,
  message: 'Put the worker script in config.js.',
};

const allowed = config.workerScript;

const onlyAllowedScript = {
  selector:
    `${scriptPath}:not([value="${allowed}"]), ` +
    `TemplateElement[value.raw=/\\.js$/]:not([value.raw="${allowed}"])`,
  message: `Name only an allowed worker script: ${allowed}.`,
};

export default [
  { ignores: ['test-results/**', 'playwright-report/**'] },
  {
    files: ['**/*.js'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node, ...globals.worker },
    },
  },

  // app.js: it starts no worker and names no script.
  {
    files: ['app.js'],
    rules: {
      'no-restricted-syntax': ['error', noWorker, noBlob, noScriptPath],
    },
  },

  // worker-client.js: it starts the worker, and reads the script from config.js.
  {
    files: ['worker-client.js'],
    rules: { 'no-restricted-syntax': ['error', noBlob, noScriptPath] },
  },

  // config.js: it names only the allowed worker script, and starts no worker.
  {
    files: ['config.js'],
    rules: {
      'no-restricted-syntax': ['error', noWorker, noBlob, onlyAllowedScript],
    },
  },
];
