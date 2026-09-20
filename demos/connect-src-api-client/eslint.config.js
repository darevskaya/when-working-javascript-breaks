import globals from 'globals';
import { apiOrigins } from './contract.js';

// The connect-src contract as lint rules. Each block below names the files it
// covers and lists all of their rules. The server, the contract, and the tests
// name origins on purpose, so the rules skip them.
export default [
  { ignores: ['test-results/**', 'playwright-report/**'] },
  {
    files: ['**/*.js'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },

  // Page code: no fetch, and no origin.
  {
    files: ['**/*.js'],
    ignores: ['server.js', 'contract.js', '*.config.js', 'test/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          // fetch(url), window.fetch(url), globalThis.fetch(url)
          selector:
            "CallExpression:matches([callee.name='fetch'],[callee.property.name='fetch'])",
          message: 'Call the API through api-client.js.',
        },
        {
          // 'https://api.example.com', `https://${host}/profile`
          selector:
            'Literal[value=/^https?:/], TemplateElement[value.raw=/^https?:/]',
          message: 'Put each API origin in config.js.',
        },
      ],
    },
  },

  // api-client.js: fetch, but only with a URL that starts from config.
  {
    files: ['api-client.js'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          // Allowed: fetch(new URL(path, config.apiOrigin))
          selector:
            "CallExpression:matches([callee.name='fetch'],[callee.property.name='fetch'])" +
            ":not([arguments.0.type='NewExpression'][arguments.0.callee.name='URL']" +
            "[arguments.0.arguments.1.object.name='config'])",
          message:
            'Build each URL from config: fetch(new URL(path, config.apiOrigin)).',
        },
        {
          selector:
            'Literal[value=/^https?:/], TemplateElement[value.raw=/^https?:/]',
          message: 'Put each API origin in config.js.',
        },
      ],
    },
  },

  // config.js: only the origins in contract.js, and no fetch.
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
          // Any origin that is not in the contract list.
          selector:
            'Literal[value=/^https?:/]' +
            `:not(${apiOrigins.map((origin) => `[value='${origin}']`).join(',')})`,
          message:
            'This origin is not in contract.js, so the customer connect-src does not allow it.',
        },
        {
          selector: 'TemplateElement[value.raw=/^https?:/]',
          message: 'Write each origin in config.js as a plain string.',
        },
      ],
    },
  },
];
