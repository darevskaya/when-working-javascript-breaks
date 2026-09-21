import globals from 'globals';
import { assignmentSinks, callSinks } from './eslint.sinks.js';

// DOM-only rendering needs no Trusted Types policy.
const message = 'Build the nodes with DOM APIs and textContent.';

export default [
  { ignores: ['test-results/**', 'playwright-report/**'] },
  {
    files: ['**/*.js'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      'no-restricted-properties': [
        'error',
        ...assignmentSinks.map((property) => ({ property, message })),
        ...callSinks.map((sink) => ({ ...sink, message })),
      ],
    },
  },
];
