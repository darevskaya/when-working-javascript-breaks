import globals from 'globals';

// Trusted Types refuses a plain string in these sinks, also a constant and an
// escaped string. The lint rule bans the same list, so the editor answers
// before the browser does.
const sinks = [
  { property: 'innerHTML' },
  { property: 'outerHTML' },
  { property: 'srcdoc' },
  { property: 'insertAdjacentHTML' },
  { property: 'setHTMLUnsafe' },
  { object: 'document', property: 'write' },
  { object: 'document', property: 'writeln' },
];

const ban = (message) => ({
  'no-restricted-properties': [
    'error',
    ...sinks.map((sink) => ({ ...sink, message })),
  ],
});

// Option A: markup from a string is gone. Every file builds its nodes with
// DOM APIs and textContent, and the app needs no policy. The page then sends
// trusted-types 'none', and the browser allows no policy either.
export const noMarkupAnywhere = [
  {
    files: ['**/*.js'],
    rules: ban('Build the nodes with DOM APIs and textContent.'),
  },
];

// Option B: one escape function writes the markup. setHTML() in trusted-html/
// escapes each value and owns the policy named orbit-widget, so only that
// folder touches a sink. The page then sends trusted-types orbit-widget.
export const onlyThroughSetHTML = [
  {
    files: ['**/*.js'],
    rules: ban("Write markup through setHTML() from 'trusted-html'."),
  },
  { files: ['trusted-html/**'], rules: { 'no-restricted-properties': 'off' } },
];

export default [
  { ignores: ['test-results/**', 'playwright-report/**'] },
  {
    files: ['**/*.js'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  // Pick one option. Write noMarkupAnywhere here to ban the sinks everywhere.
  ...onlyThroughSetHTML,
];
