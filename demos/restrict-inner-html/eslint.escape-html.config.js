import globals from 'globals';

const sinkMessage =
  'Write markup with policyHtml: element.innerHTML = policyHtml(`…`).';
const templateMessage = 'Pass a template literal to policyHtml.';
const escapeMessage = 'Wrap each value in escapeHtml: ${escapeHtml(value)}.';

// Every markup sink accepts only a policyHtml() call on a template literal,
// and every value in that template goes through escapeHtml().
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
            "AssignmentExpression[left.property.name=/^(innerHTML|outerHTML|srcdoc)$/]:not([right.callee.name='policyHtml'])",
          message: sinkMessage,
        },
        {
          selector:
            "CallExpression[callee.name='policyHtml'] > .arguments:not(TemplateLiteral)",
          message: templateMessage,
        },
        {
          selector:
            "CallExpression[callee.name='policyHtml'] > TemplateLiteral > .expressions:not(CallExpression[callee.name='escapeHtml'])",
          message: escapeMessage,
        },
      ],
    },
  },
];
