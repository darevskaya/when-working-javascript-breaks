export default [
  {
    files: ['**/*.js'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "Property[key.name='devtool'][value.value=/^eval/]",
          message:
            "This devtool wraps every module in eval(), and script-src without 'unsafe-eval' blocks the bundle. Use devtool: 'source-map'.",
        },
      ],
    },
  },
];
