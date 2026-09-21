import globals from 'globals';

// Escaping prevents injection here, but still fails Trusted Types.
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
          message: 'Write markup with the escapeHtml tagged template.',
        },
        {
          property: 'setHTMLUnsafe',
          message: 'Write markup with the escapeHtml tagged template.',
        },
        {
          object: 'document',
          property: 'write',
          message: 'Write markup with the escapeHtml tagged template.',
        },
        {
          object: 'document',
          property: 'writeln',
          message: 'Write markup with the escapeHtml tagged template.',
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "AssignmentExpression[left.property.name=/^(innerHTML|outerHTML|srcdoc)$/]:not([right.tag.name='escapeHtml'])",
          message:
            'Write markup with the escapeHtml tagged template: element.innerHTML = escapeHtml`…`.',
        },
      ],
    },
  },
];
