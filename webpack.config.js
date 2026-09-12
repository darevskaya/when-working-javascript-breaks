import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));

// Exactly the same feature source, compiled with two different devtool settings.
export default ['eval-source-map', 'source-map'].map((devtool) => ({
  name: devtool,
  mode: 'production',
  context: root,
  devtool,
  entry: './demos/calculator/dialog.js',
  output: {
    path: path.join(
      root,
      'dist',
      devtool === 'eval-source-map' ? 'eval' : 'fixed',
    ),
    filename: 'dialog.js',
    library: { name: 'CalculatorDialog', type: 'window' },
    clean: true,
  },
}));
