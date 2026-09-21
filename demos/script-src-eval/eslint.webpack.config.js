// Lint 3 of 3: the devtool in the build configuration.
// Run it with: npm run lint:webpack
//
// This lint reads webpack.config.js alone. It flags every devtool whose name
// starts with eval, because each one wraps every module of the bundle in
// eval(). Lint 2 finds the result. This lint finds the cause.
export default [
  {
    files: ['**/*.js'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          // devtool: 'eval', devtool: 'eval-source-map',
          // devtool: 'eval-cheap-module-source-map'.
          selector: "Property[key.name='devtool'][value.value=/^eval/]",
          message:
            "This devtool wraps every module in eval(), and script-src without 'unsafe-eval' blocks the bundle. Use devtool: 'source-map'.",
        },
      ],
    },
  },
];
