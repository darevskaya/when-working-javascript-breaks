import globals from 'globals';

// Two habits that hide a precondition. The page code breaks each one once, so
// `npm run lint` fails on purpose.
export default [
  { ignores: ['test-results/**', 'playwright-report/**'] },
  {
    files: ['**/*.js'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  {
    files: ['**/*.js'],
    ignores: ['server.js', 'routes.js', '*.config.js', 'test/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          // if (navigator.wakeLock), if (navigator.clipboard)
          selector:
            "IfStatement[test.type='MemberExpression'][test.object.name='navigator']",
          message:
            'The property is there, and the call can still fail on a policy, a permission, or the activation state. Handle the rejection instead.',
        },
        {
          // 'geolocation' in navigator
          selector: "BinaryExpression[operator='in'][right.name='navigator']",
          message:
            'The property is there, and the call can still fail on a policy, a permission, or the activation state. Handle the rejection instead.',
        },
        {
          // setTimeout(() => navigator.clipboard.writeText(text), 1000)
          selector:
            'CallExpression[callee.name=/^(setTimeout|setInterval|requestIdleCallback)$/] ' +
            'CallExpression[callee.property.name=/^(writeText|write|read|readText|requestFullscreen|requestPointerLock|share|requestDevice|showPicker)$/]',
          message:
            'Transient activation expires. A timer callback can run without it, and then the browser refuses this call.',
        },
      ],
    },
  },
];
