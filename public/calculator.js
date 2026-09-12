const settings = new URLSearchParams(location.search);
const example = settings.get('example') === 'function' ? 'function' : 'webpack';
const version = settings.get('version') === 'fixed' ? 'fixed' : 'original';
const controls = document.querySelector('#calculator-controls');
const button = document.querySelector('#open-calculator');
const status = document.querySelector('#calculator-status');
const dialog = document.querySelector('#calculator-dialog');

// Isolate the two causes: only the Webpack example uses an eval-based bundle.
const bundle =
  example === 'webpack' && version === 'original' ? 'eval' : 'fixed';
const useFunction = example === 'function' && version === 'original';

function syncControls() {
  controls.elements.policy.value = location.pathname.endsWith('/restricted')
    ? 'restricted'
    : 'permissive';
  controls.elements.example.value = example;
  controls.elements.version.value = version;
  document.querySelector('#version-label').textContent =
    example === 'webpack' ? 'Webpack source maps' : 'Calculation function';
  document.querySelector('#original-label').textContent =
    example === 'webpack' ? 'eval-source-map' : 'new Function';
  document.querySelector('#fixed-label').textContent =
    example === 'webpack' ? 'source-map' : 'Regular function';
}

syncControls();
window.addEventListener('pageshow', syncControls);
controls.addEventListener('change', () => {
  const { policy, example, version } = controls.elements;
  location.assign(
    `/demo/calculator/${policy.value}?example=${example.value}&version=${version.value}`,
  );
});

let loading;
function loadDialog() {
  if (window.CalculatorDialog?.openCalculatorDialog) return Promise.resolve();
  if (loading) return loading;

  loading = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `/bundles/${bundle}/dialog.js`;
    script.onload = () => {
      // A successful download does not mean CSP allowed the code to execute.
      if (window.CalculatorDialog?.openCalculatorDialog) resolve();
      else reject(new Error('The dialog downloaded but could not initialize.'));
    };
    script.onerror = () =>
      reject(new Error('The dialog bundle could not be loaded.'));
    document.head.append(script);
  }).catch((error) => {
    loading = undefined;
    throw error;
  });
  return loading;
}

button.addEventListener('click', async () => {
  button.disabled = true;
  try {
    await loadDialog();
    window.CalculatorDialog.openCalculatorDialog(useFunction);
    status.textContent = 'Calculator opened';
  } catch (error) {
    status.textContent = 'Calculator unavailable. See the browser console.';
    console.error(error);
  } finally {
    button.disabled = false;
  }
});

document
  .querySelector('#close-calculator')
  .addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => {
  status.textContent = 'Ready';
  button.focus();
});
