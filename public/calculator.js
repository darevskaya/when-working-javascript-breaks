const controls = document.querySelector('#calculator-controls');
const button = document.querySelector('#open-calculator');
const status = document.querySelector('#calculator-status');
const dialog = document.querySelector('#calculator-dialog');

function syncControls() {
  controls.elements.policy.value = location.pathname.endsWith('/restricted')
    ? 'restricted'
    : 'permissive';
}

syncControls();
window.addEventListener('pageshow', syncControls);
controls.addEventListener('change', () => {
  const { policy } = controls.elements;
  location.assign(`/demo/calculator/${policy.value}`);
});

let loading;
function loadDialog() {
  if (window.CalculatorDialog?.openCalculatorDialog) return Promise.resolve();
  if (loading) return loading;

  loading = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = '/bundles/dialog.js';
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
    window.CalculatorDialog.openCalculatorDialog();
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
