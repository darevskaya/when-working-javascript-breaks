import globals from 'globals';

// window.top.location.href = url, top.location.href = url,
// window.top.location = url
const topNavigation = {
  selector:
    'AssignmentExpression:matches(' +
    "[left.object.property.name='location'][left.object.object.property.name='top']," +
    "[left.object.property.name='location'][left.object.object.name='top']," +
    "[left.property.name='location'][left.object.property.name='top'])",
  message:
    'In a sandboxed iframe, this needs allow-top-navigation-by-user-activation and a click. Put it in the embedding contract.',
};

// The rule for this demo: a frame that navigates the whole page depends on a
// sandbox token that the customer controls.
export default [
  { ignores: ['test-results/**', 'playwright-report/**'] },
  {
    files: ['**/*.js'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: { 'no-restricted-syntax': ['error', topNavigation] },
  },
];
