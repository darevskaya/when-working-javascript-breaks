import globals from 'globals';

// devtool: 'eval-source-map', devtool: 'eval-cheap-source-map', devtool: 'eval'
// Each one wraps every module of the bundle in eval().
const evalDevtool = {
  selector: "Property[key.name='devtool'][value.value=/^eval/]",
  message:
    "This devtool wraps every module in eval(), and script-src without 'unsafe-eval' blocks the bundle. Use devtool: 'source-map'.",
};

// The rules for this demo: code that turns a string into running code.
// script-src without 'unsafe-eval' blocks all three forms. One more rule
// checks the build configuration, because the build can add eval too.
export default [
  { ignores: ['dist/**', 'test-results/**', 'playwright-report/**'] },
  {
    files: ['**/*.js'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      'no-eval': ['error', { allowIndirect: false }],
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-restricted-syntax': ['error', evalDevtool],
    },
  },
];
