import globals from 'globals';
import noUnsanitized from 'eslint-plugin-no-unsanitized';

// el.innerHTML = markup, el.innerHTML += markup, el['innerHTML'] = markup
// Under require-trusted-types-for 'script', each one throws a TypeError, even
// with a constant or escaped string. eslint-plugin-no-unsanitized allows
// both, because they are not an XSS risk, so this rule stays.
// The one exception: el.innerHTML = html`…`, because the html tag returns
// TrustedHTML from the Trusted Types policy in innerhtml-policy.js.
const innerHTML = {
  selector:
    "AssignmentExpression:matches([left.property.name='innerHTML'],[left.property.value='innerHTML'])" +
    ":not([right.type='TaggedTemplateExpression'][right.tag.name='html'])",
  message: 'Build markup with DOM APIs and textContent, not innerHTML.',
};

// The rules for this demo: markup sinks that Trusted Types blocks.
// eslint-plugin-no-unsanitized also flags outerHTML, insertAdjacentHTML(),
// and document.write(), which the innerHTML rule does not see.
export default [
  { ignores: ['test-results/**', 'playwright-report/**'] },
  noUnsanitized.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      'no-restricted-syntax': ['error', innerHTML],
      // The plugin's default escape tags, plus html, which escapes each value.
      'no-unsanitized/property': [
        'error',
        {
          escape: {
            taggedTemplates: ['Sanitizer.escapeHTML', 'escapeHTML', 'html'],
          },
        },
      ],
    },
  },
];
