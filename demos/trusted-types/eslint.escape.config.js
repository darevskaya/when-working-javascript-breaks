import globals from 'globals';
import { assignmentNotTaggedWith, banCalls } from './eslint.sinks.js';

// Lint 2 of 3: markup only from escapeHtml.
// Run it with: npm run lint:escape
//
// A markup sink may take a value from the escapeHtml tagged template and from
// nothing else. escapeHtml turns the five markup characters of each value into
// entities, so a value can never open a tag. That stops injection.
//
// It does not stop Trusted Types. The result of escapeHtml is still a string,
// so /demo/trusted-types/escape throws in the browser. This configuration is
// the right one for an app without the header, and it is not enough with it.
//
// In app.js it flags renderString and renderPolicy. Only renderEscape passes.
export default [
  { ignores: ['test-results/**', 'playwright-report/**'] },
  {
    files: ['**/*.js'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      ...banCalls('Write markup with the escapeHtml tagged template.'),
      'no-restricted-syntax': [
        'error',
        {
          selector: assignmentNotTaggedWith('escapeHtml'),
          message:
            'Write markup with the escapeHtml tagged template: element.innerHTML = escapeHtml`…`.',
        },
      ],
    },
  },
];
