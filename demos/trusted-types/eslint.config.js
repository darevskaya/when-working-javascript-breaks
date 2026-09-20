import globals from 'globals';

export default [
  { ignores: ['test-results/**', 'playwright-report/**'] },
  {
    files: ['**/*.js'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          // el.innerHTML = markup, el.outerHTML = markup,
          // el.innerHTML += markup, el['innerHTML'] = markup
          selector:
            'AssignmentExpression:matches([left.property.name=/^(inner|outer)HTML$/],[left.property.value=/^(inner|outer)HTML$/])',
          message:
            "Trusted Types blocks strings in this markup sink. Write markup through setHTML() from 'trusted-html'.",
        },
        {
          // el.insertAdjacentHTML('beforeend', markup), document.write(markup)
          selector:
            "CallExpression:matches([callee.property.name='insertAdjacentHTML'],[callee.object.name='document'][callee.property.name=/^write(ln)?$/])",
          message:
            "Trusted Types blocks strings in this markup sink. Write markup through setHTML() from 'trusted-html'.",
        },
      ],
      // import { setHTML } from 'trusted-html', not from a path into it.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/trusted-html/**', '**/trusted-html.js'],
              message: "Import setHTML from the 'trusted-html' package.",
            },
          ],
        },
      ],
    },
  },
  // The trusted-html package: the same rules, except inside the setHTML
  // function, which uses the Trusted Types policy.
  {
    files: ['trusted-html/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'AssignmentExpression:matches([left.property.name=/^(inner|outer)HTML$/],[left.property.value=/^(inner|outer)HTML$/])' +
            ":not(FunctionDeclaration[id.name='setHTML'] AssignmentExpression)",
          message: 'Only the setHTML function may write markup.',
        },
        {
          selector:
            "CallExpression:matches([callee.property.name='insertAdjacentHTML'],[callee.object.name='document'][callee.property.name=/^write(ln)?$/])" +
            ":not(FunctionDeclaration[id.name='setHTML'] CallExpression)",
          message: 'Only the setHTML function may write markup.',
        },
      ],
    },
  },

  // The strictest option: no markup sink anywhere, not even in the package.
  // The widget then builds every node with DOM APIs and textContent, and the
  // app needs no Trusted Types policy. To use it, remove the // below. This
  // block comes last, so it replaces the rules above for every file.
  // {
  //   files: ['**/*.js'],
  //   rules: {
  //     'no-restricted-syntax': [
  //       'error',
  //       {
  //         // el.innerHTML = markup, el.outerHTML = markup, el.srcdoc = page
  //         selector:
  //           'AssignmentExpression:matches([left.property.name=/^(inner|outer)HTML$/],[left.property.value=/^(inner|outer)HTML$/],[left.property.name="srcdoc"])',
  //         message:
  //           'Build markup with DOM APIs and textContent. This app writes no markup from a string.',
  //       },
  //       {
  //         // el.insertAdjacentHTML(), el.setHTMLUnsafe(),
  //         // range.createContextualFragment(), parser.parseFromString(),
  //         // document.write(), document.writeln()
  //         selector:
  //           "CallExpression:matches([callee.property.name=/^(insertAdjacentHTML|setHTMLUnsafe|createContextualFragment|parseFromString)$/],[callee.object.name='document'][callee.property.name=/^write(ln)?$/])",
  //         message:
  //           'Build markup with DOM APIs and textContent. This app writes no markup from a string.',
  //       },
  //     ],
  //   },
  // },
];
