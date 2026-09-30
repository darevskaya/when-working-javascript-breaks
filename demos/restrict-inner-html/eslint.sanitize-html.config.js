import globals from 'globals';

const sinkMessage =
  'Write markup with sanitizeHtml: element.innerHTML = sanitizeHtml(markup).';

export default [
  { ignores: ['test-results/**', 'playwright-report/**'] },
  {
    files: ['renderers/*.js'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "AssignmentExpression[left.property.name=/^(innerHTML|outerHTML|srcdoc)$/]:not([right.callee.name='sanitizeHtml'])",
          message: sinkMessage,
        },
      ],
    }
  },
];
