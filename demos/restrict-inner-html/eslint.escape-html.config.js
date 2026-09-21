import globals from 'globals';

export default [
  { ignores: ['test-results/**', 'playwright-report/**'] },
  {
    files: ['render-with-*.js'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      'no-restricted-properties': [
        'error',
        {
          property: 'insertAdjacentHTML',
          message: 'Write markup with the policyHtml tagged template.',
        },
        {
          property: 'setHTMLUnsafe',
          message: 'Write markup with the policyHtml tagged template.',
        },
        {
          object: 'document',
          property: 'write',
          message: 'Write markup with the policyHtml tagged template.',
        },
        {
          object: 'document',
          property: 'writeln',
          message: 'Write markup with the policyHtml tagged template.',
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "AssignmentExpression[left.property.name=/^(innerHTML|outerHTML|srcdoc)$/]:not([right.tag.name='policyHtml'])",
          message:
            'Write markup with the policyHtml tagged template: element.innerHTML = policyHtml`…`.',
        },
      ],
    },
  },
];
