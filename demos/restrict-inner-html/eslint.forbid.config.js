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
        },
        {
          property: 'outerHTML',
          message:
            'Use createElement, textContent, and append, not HTML strings.',
        },
        {
          property: 'srcdoc',
          message:
            'Use createElement, textContent, and append, not HTML strings.',
        },
        {
          property: 'insertAdjacentHTML',
          message:
            'Use createElement, textContent, and append, not HTML strings.',
        },
        {
          property: 'setHTMLUnsafe',
          message:
            'Use createElement, textContent, and append, not HTML strings.',
        },
        {
          object: 'document',
          property: 'write',
          message:
            'Use createElement, textContent, and append, not HTML strings.',
        },
        {
          object: 'document',
          property: 'writeln',
          message:
            'Use createElement, textContent, and append, not HTML strings.',
        },
      ],
    },
  },
];
