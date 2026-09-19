// The same renderer as a module file. The browser loads this file from the
// origin of the page, so worker-src 'self' allows it.
import { renderFractal } from '/fractal-worker.js';

renderFractal();
