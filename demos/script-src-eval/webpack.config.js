import path from 'node:path';
import webpack from 'webpack';

export default {
  mode: 'production',

  // This devtool wraps every module of the bundle in eval(). The bundled
  // source has no eval, and the bundle has one per module. To show the fix,
  // comment out the next line and remove the // from the line after it.
  devtool: 'eval-source-map',
  // devtool: 'source-map',

  context: import.meta.dirname,
  entry: './app.js',
  plugins: [
    // The page uses the eval renderer. The bundle uses the clean one, so the
    // only eval in the bundle comes from the devtool above.
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
