import path from 'node:path';
import webpack from 'webpack';

const dist = path.join(import.meta.dirname, 'dist');

// Both bundles build the same calculator dialog.
const dialog = {
  mode: 'production',
  context: import.meta.dirname,
  entry: './demos/calculator/dialog.js',
};

export default [
  // The dialog source compiles each formula with new Function.
  {
    ...dialog,
    devtool: 'source-map',
    output: {
      path: dist,
      filename: 'dialog.js',
      library: { name: 'CalculatorDialog', type: 'window' },
      // The second bundle owns dist/eval. Leave it alone here.
      clean: { keep: 'eval' },
    },
  },
  // The same dialog with the CSP-safe calculator, so the source has no eval.
  // An eval devtool wraps every module in eval() anyway, and script-src 'self'
  // blocks the bundle.
  {
    ...dialog,
    devtool: 'eval-source-map',
    plugins: [
      new webpack.NormalModuleReplacementPlugin(
        /^\.\/calculate\.js$/,
        './calculate-safe.js',
      ),
    ],
    output: {
      path: path.join(dist, 'eval'),
      filename: 'dialog.js',
      library: { name: 'CalculatorDialog', type: 'window' },
      clean: true,
    },
  },
];
