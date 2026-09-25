import path from 'node:path';
import webpack from 'webpack';

export default {
  mode: 'production',

  // Adds eval to each module; use source-map to avoid it.
  devtool: 'eval-source-map',
 //  devtool: 'source-map',

  context: import.meta.dirname,
  entry: './app.js',
  plugins: [
    // Keep source eval out to isolate the devtool failure.
    new webpack.NormalModuleReplacementPlugin(
      /^\.\/renderer\.js$/,
      './clean-renderer.js',
    ),
  ],
  output: {
    path: path.join(import.meta.dirname, 'dist'),
    filename: 'app.js',
    clean: true,
  },
};
