import path from 'node:path';
import webpack from 'webpack';

// Builds the page script into dist/summary.js for the bundle page. The build
// uses template-safe.js, so the source has no eval.
export default {
  mode: 'production',
  context: import.meta.dirname,
  entry: './summary.js',
  plugins: [
    new webpack.NormalModuleReplacementPlugin(
      /^\.\/template\.js$/,
      './template-safe.js',
    ),
  ],
  // eval-source-map wraps every module in eval(), so the bundle needs
  // 'unsafe-eval', and script-src 'self' blocks it.
  devtool: 'eval-source-map',
  // The correct configuration: a separate source map file, and no eval.
  // Comment out the line above, remove the // below, and run npm run build.
  // devtool: 'source-map',
  output: {
    path: path.join(import.meta.dirname, 'dist'),
    filename: 'summary.js',
    clean: true,
  },
};
