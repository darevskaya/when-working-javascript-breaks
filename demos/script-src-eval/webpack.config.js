import path from 'node:path';
import webpack from 'webpack';

// Builds the page script into dist/templates-page.js for the bundle page. The build
// uses function-renderer.js, so the source has no eval.
export default {
  mode: 'production',
  context: import.meta.dirname,
  entry: './templates-page.js',
  plugins: [
    new webpack.NormalModuleReplacementPlugin(
      /^\.\/eval-renderer\.js$/,
      './function-renderer.js',
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
    filename: 'templates-page.js',
    clean: true,
  },
};
