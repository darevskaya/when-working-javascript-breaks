import globals from 'globals';
import { assignmentSinks, callSinks } from './eslint.sinks.js';

// Lint 1 of 3: no markup from a string, anywhere.
// Run it with: npm run lint:forbid
//
// This is the strictest answer. Every file builds its nodes with DOM APIs and
// writes its values with textContent, so the app needs no Trusted Types policy
// and the page can send trusted-types 'none'. The rule has no exception for a
// constant string or an escaped string, because Trusted Types refuses both.
//
// In app.js it flags renderString, renderEscape and renderPolicy. Only
// renderDom passes.
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
