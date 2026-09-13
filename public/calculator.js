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

function loadDialog() {
  if (window.CalculatorDialog) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = '/bundles/dialog.js';
    script.onload = () =>
      // A successful download does not mean CSP allowed the code to execute.
      window.CalculatorDialog
        ? resolve()
        : reject(new Error('The dialog bundle downloaded but did not run.'));
    script.onerror = () =>
      reject(new Error('The dialog bundle failed to load.'));
    document.head.append(script);
  });
}

button.addEventListener('click', async () => {
  button.disabled = true;
  status.className = '';
  try {
    await loadDialog();
    window.CalculatorDialog.openCalculatorDialog();
    status.textContent = 'Calculator opened';
  } catch (error) {
    status.className = 'blocked';
    status.textContent = error.message;
    console.error(error);
  } finally {
    button.disabled = false;
  }
});

document
  .querySelector('#close-calculator')
  .addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => {
  status.className = '';
  status.textContent = 'Ready';
  button.focus();
});
