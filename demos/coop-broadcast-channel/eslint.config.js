import globals from 'globals';

export default [
  { ignores: ['test-results/**', 'playwright-report/**'] },
  {
    files: ['**/*.js'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "MemberExpression[property.name='closed']",
          message:
            'popup.closed is true when COOP separates the popup, even while it is open. Do not read it as a cancel.',
        },
        {
          selector:
            "MemberExpression[object.name='window'][property.name='opener']",
          message:
            'window.opener is null when either page sends COOP same-origin, and with noopener.',
        },
      ],
    },
  },
  // Tests intentionally read popup state.
  { files: ['test/**'], rules: { 'no-restricted-syntax': 'off' } },
];
