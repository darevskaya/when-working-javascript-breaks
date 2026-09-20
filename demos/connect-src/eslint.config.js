import globals from 'globals';

// An absolute URL in the code is a host that the customer's connect-src must
// allow.
export default [
  { ignores: ['test-results/**', 'playwright-report/**'] },
  {
    files: ['**/*.js'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          // 'https://identity.customer.com', `https://${host}/profile`
          selector:
            'Literal[value=/^https?:/], TemplateElement[value.raw=/^https?:/]',
          message:
            'connect-src allows only the hosts that the customer lists. Keep API hosts in one configuration module, and list them in the contract.',
        },
      ],
    },
  },
  // The tests and the test configuration name hosts on purpose.
  {
    files: ['test/**', 'stage/**', '*.config.js'],
    rules: { 'no-restricted-syntax': 'off' },
  },
];
