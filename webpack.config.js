import path from 'node:path';

export default {
  mode: 'production',
  context: import.meta.dirname,
  devtool: 'source-map',
  // Uncomment and rebuild to see CSP block the dialog with script-src 'self'.
  // devtool: 'eval-source-map',
  entry: './demos/calculator/dialog.js',
  output: {
    path: path.join(import.meta.dirname, 'dist'),
    filename: 'dialog.js',
    library: { name: 'CalculatorDialog', type: 'window' },
    clean: true,
  },
};
