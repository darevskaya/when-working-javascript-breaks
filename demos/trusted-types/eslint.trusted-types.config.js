import globals from 'globals';
import { assignmentNotTaggedWith, banCalls } from './eslint.sinks.js';

// Lint 3 of 3: markup only from a Trusted Types policy.
// Run it with: npm run lint:trusted-types
//
// A markup sink may take a value from the policyHtml tagged template and from
// nothing else. policyHtml escapes each value and then passes the markup
// through the Trusted Types policy named orbit-widget, so the result is a
// TrustedHTML object, not a string. A page that sends
// require-trusted-types-for 'script' accepts that object, and the page must
// name orbit-widget in its trusted-types list.
//
// In app.js it flags renderString and renderEscape. Only renderPolicy passes.
export default [
  { ignores: ['test-results/**', 'playwright-report/**'] },
  {
    files: ['**/*.js'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      ...banCalls('Write markup with the policyHtml tagged template.'),
      'no-restricted-syntax': [
        'error',
        {
          selector: assignmentNotTaggedWith('policyHtml'),
          message:
            'Write markup with the policyHtml tagged template: element.innerHTML = policyHtml`…`.',
        },
      ],
    },
  },
];
