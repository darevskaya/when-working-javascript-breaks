import globals from 'globals';

// Two rules hold the architecture up.
const noFetch = {
  // fetch(url), window.fetch(url), globalThis.fetch(url)
  selector:
    "CallExpression:matches([callee.name='fetch'],[callee.property.name='fetch'])",
  message: 'Call the API through api-client.js.',
};

const noOrigin = {
  // 'https://api.example.com', `https://${host}/profile`
  selector: 'Literal[value=/^https?:/], TemplateElement[value.raw=/^https?:/]',
  message: 'Put each API origin in config.js.',
};

const restrict = (...rules) => ({
  'no-restricted-syntax': ['error', ...rules],
});

export default [
  { ignores: ['test-results/**', 'playwright-report/**'] },
  {
    files: ['**/*.js'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },

  // Page code: no fetch, and no origin.
  {
    files: ['app.js'],
    rules: restrict(noFetch, noOrigin),
  },

  // The API client may call fetch. It still may not name an origin, so every
  // URL starts from config.js.
  {
    files: ['api-client.js'],
    rules: restrict(noOrigin),
  },

  // The configuration may name an origin. It may not call fetch.
  {
    files: ['config.js'],
    rules: restrict(noFetch),
  },
];
