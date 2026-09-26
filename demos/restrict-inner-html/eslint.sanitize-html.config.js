import globals from 'globals';

const sinkMessage =
  'Write markup with sanitizeHtml: element.innerHTML = sanitizeHtml(markup).';

// Every markup sink accepts only a sanitizeHtml() call.
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
            "AssignmentExpression[left.property.name=/^(innerHTML|outerHTML|srcdoc)$/]:not([right.callee.name='sanitizeHtml'])",
          message: sinkMessage,
        },
      ],
    }
  },
];
