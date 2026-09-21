import globals from 'globals';

// DOM-only rendering needs no Trusted Types policy.
export default [
  { ignores: ['test-results/**', 'playwright-report/**'] },
  {
    files: ['render-with-*.js'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      'no-restricted-properties': [
        'error',
        {
          property: 'innerHTML',
          message:
            'Use createElement, textContent, and append, not HTML strings.',
        }
      ],
    },
  },
];
