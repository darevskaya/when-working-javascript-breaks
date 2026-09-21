import globals from 'globals';

const noFetch = {
  selector:
    "CallExpression:matches([callee.name='fetch'],[callee.property.name='fetch'])",
  message: 'Call the API through api-client.js.',
};

const noOrigin = {
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

  {
    files: ['app.js'],
    rules: restrict(noFetch, noOrigin),
  },

  {
    files: ['api-client.js'],
    rules: restrict(noOrigin),
  },

  {
    files: ['config.js'],
    rules: restrict(noFetch),
  },
];
