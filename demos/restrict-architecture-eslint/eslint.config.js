import globals from 'globals';

export default [
  { ignores: ['test-results/**', 'playwright-report/**'] },
  {
    files: ['**/*.js'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },

  // app.js: no fetch call and no origin.
  {
    files: ['app.js'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "CallExpression:matches([callee.name='fetch'],[callee.property.name='fetch'])",
          message: 'Call the API through api-client.js.',
        },
        {
          selector:
            'Literal[value=/^https?:/], TemplateElement[value.raw=/^https?:/]',
          message: 'Put each API origin in config.js.',
        },
      ],
    },
  },

  // api-client.js: may call fetch, but names no origin.
  {
    files: ['api-client.js'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'Literal[value=/^https?:/], TemplateElement[value.raw=/^https?:/]',
          message: 'Put each API origin in config.js.',
        },
      ],
    },
  },

  // config.js: no fetch call, and only the allowed origin http://127.0.0.1:4308.
  {
    files: ['config.js'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "CallExpression:matches([callee.name='fetch'],[callee.property.name='fetch'])",
          message: 'Call the API through api-client.js.',
        },
        {
          selector:
            'Literal[value=/^https?:/]:not([value="http://127.0.0.1:4308"]), TemplateElement[value.raw=/^https?:/]:not([value.raw="http://127.0.0.1:4308"])',
          message: 'Name only an allowed origin: http://127.0.0.1:4308.',
        },
      ],
    },
  },
];
