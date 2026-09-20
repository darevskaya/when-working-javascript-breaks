import globals from 'globals';

// The same rules as the coop-popup demo: COOP cuts the window relationship.
// Then popup.closed is true while the popup is still open, and window.opener
// is null in the popup. This login reads neither, so lint passes.
export default [
  { ignores: ['test-results/**', 'playwright-report/**'] },
  {
    files: ['**/*.js'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          // popup.closed
          selector: "MemberExpression[property.name='closed']",
          message:
            'popup.closed is true when COOP separates the popup, even while it is open. Do not read it as a cancel.',
        },
        {
          // window.opener
          selector:
            "MemberExpression[object.name='window'][property.name='opener']",
          message:
            'window.opener is null when either page sends COOP same-origin, and with noopener.',
        },
      ],
    },
  },
  // The tests read popup state on purpose.
  { files: ['test/**'], rules: { 'no-restricted-syntax': 'off' } },
];
