import globals from 'globals';
import { assignmentNotTaggedWith, banCalls } from './eslint.sinks.js';

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
