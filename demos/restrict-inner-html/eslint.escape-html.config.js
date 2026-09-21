import globals from 'globals';

const message =
  'Write markup with the policyHtml tagged template: element.innerHTML = policyHtml`…`.';

// Every markup sink accepts only a value from the policyHtml tagged template.
export default [
  { ignores: ['test-results/**', 'playwright-report/**'] },
  {
    files: ['render-with-*.js'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "AssignmentExpression[left.property.name=/^(innerHTML|outerHTML|srcdoc)$/]:not([right.tag.name='policyHtml'])",
          message,
        }
      ],
    },
  },
];
