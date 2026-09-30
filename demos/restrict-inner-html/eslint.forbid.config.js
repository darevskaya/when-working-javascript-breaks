import globals from 'globals';

export default [
  { ignores: ['test-results/**', 'playwright-report/**'] },
  {
    files: ['renderers/*.js'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      'no-restricted-properties': [
        'error',
        {
          property: 'innerHTML',
          message:
            'Use createElement, textContent, and append, not HTML strings.',
        },
      ],
    },
  },
];
