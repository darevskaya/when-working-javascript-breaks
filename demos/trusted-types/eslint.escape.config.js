import globals from 'globals';
import { assignmentNotTaggedWith, banCalls } from './eslint.sinks.js';

// Escaping prevents injection here, but still fails Trusted Types.
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
