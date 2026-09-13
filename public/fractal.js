import { renderFractal } from '/fractal-worker.js';

const controls = document.querySelector('#fractal-controls');
const canvas = document.querySelector('#fractal-canvas');
const context = canvas.getContext('2d');
const progress = document.querySelector('#fractal-progress');
const percent = document.querySelector('#fractal-percent');
const status = document.querySelector('#status');

function syncControls() {
  controls.elements.policy.value = location.pathname.endsWith('/restricted')
    ? 'restricted'
    : 'permissive';
}
syncControls();
window.addEventListener('pageshow', syncControls);
controls.addEventListener('change', () => {
  location.assign(`/demo/fractal/${controls.elements.policy.value}`);
});

let worker;
let workerURL;
function cleanup() {
  worker?.terminate();
  if (workerURL) URL.revokeObjectURL(workerURL);
}

function fail(message) {
  cleanup();
  status.className = 'blocked';
  status.textContent = message;
}

// Use the browser's violation event to distinguish CSP from other worker errors.
document.addEventListener('securitypolicyviolation', (event) => {
  if (
    event.effectiveDirective === 'worker-src' &&
    event.blockedURI.startsWith('blob')
  ) {
    fail('Worker blocked by Content Security Policy');
  }
});

try {
  const blob = new Blob([`(${renderFractal.toString()})();`], {
    type: 'text/javascript',
  });
  workerURL = URL.createObjectURL(blob);
  worker = new Worker(workerURL);
  worker.onmessage = ({ data: { row, rows, pixels } }) => {
    context.putImageData(new ImageData(pixels, canvas.width, rows), 0, row);
    const value = Math.round(((row + rows) / canvas.height) * 100);
    progress.value = value;
    percent.textContent = `${value}%`;
    if (row + rows === canvas.height) {
      status.textContent = 'Render complete';
      cleanup();
    }
  };
  worker.onerror = (event) => {
    console.error('Fractal worker failed', event);
    if (!status.classList.contains('blocked')) fail('Worker failed to render');
  };
  status.textContent = 'Rendering fractal…';
  worker.postMessage({ width: canvas.width, height: canvas.height });
} catch (error) {
  console.error(error);
  fail(
    error.name === 'SecurityError'
      ? 'Worker blocked by Content Security Policy'
      : 'Worker failed to start',
  );
}
window.addEventListener('pagehide', cleanup);
