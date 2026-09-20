import path from 'node:path';
import webpack from 'webpack';

export default {
  mode: 'production',
  devtool: 'hidden-source-map',

  context: import.meta.dirname,
  entry: './templates-page.js',
  plugins: [
    new webpack.NormalModuleReplacementPlugin(
      /^\.\/eval-renderer\.js$/,
      './function-renderer.js',
    ),
  ],
  output: {
    path: path.join(import.meta.dirname, 'dist'),
    filename: 'templates-page.js',
    clean: true,
  },
};
