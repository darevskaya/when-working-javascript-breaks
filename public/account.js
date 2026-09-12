const settings = new URLSearchParams(location.search);
const build = settings.get('build') === 'fixed' ? 'fixed' : 'eval';
const status = document.querySelector('#account-status');
const button = document.querySelector('#open-dialog');
function report(message, kind = 'info') {
  if (kind === 'error') console.error(message);
  else console.info(message);
}

/*
document.addEventListener('securitypolicyviolation', (event) => {
  report(
    `CSP blocked ${event.blockedURI}\nDirective: ${event.effectiveDirective}\nPolicy: ${event.originalPolicy}`,
    'error',
  );
});
window.addEventListener('error', (event) => report(event.message, 'error')); */
let loading;
function loadFeature() {
  if (window.ProfileDialog?.openProfileDialog) return Promise.resolve();
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `/bundles/${build}/dialog.js`;
    // A script can download successfully even when CSP blocks its execution.
    script.onload = () =>
      window.ProfileDialog?.openProfileDialog
        ? resolve()
        : reject(
            new Error(
              'The feature downloaded, but did not initialize. See the browser console.',
            ),
          );
    script.onerror = () =>
      reject(new Error('The feature bundle could not be loaded.'));
    document.head.append(script);
  }).catch((error) => {
    // Let the next click retry after a failed download or execution.
    loading = undefined;
    throw error;
  });
  return loading;
}
button.addEventListener('click', async () => {
  button.disabled = true;
  report('Click → loading dialog feature');
  try {
    await loadFeature();
    window.ProfileDialog.openProfileDialog();
    status.textContent = 'Dialog opened';
    report('Dialog opened successfully', 'success');
  } catch (error) {
    status.textContent = 'Dialog unavailable. See the browser console.';
    report(error.message, 'error');
  } finally {
    button.disabled = false;
  }
});
const dialog = document.querySelector('#profile-dialog');
const nameInput = document.querySelector('#display-name');

document
  .querySelector('#cancel')
  .addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => {
  if (status.textContent === 'Dialog opened')
    status.textContent = 'Account ready';
  nameInput.setCustomValidity('');
});
nameInput.addEventListener('input', () => nameInput.setCustomValidity(''));
document.querySelector('#profile-form').addEventListener('submit', (event) => {
  const value = nameInput.value.trim();
  if (!value) {
    event.preventDefault();
    nameInput.setCustomValidity('Enter a name, not just spaces.');
    nameInput.reportValidity();
    return;
  }
  document.querySelector('#current-name').textContent = value;
  document.querySelector('.avatar').textContent = [...value][0].toUpperCase();
  status.textContent = 'Display name saved';
  report('Display name saved', 'success');
});
report('Account ready. No dialog code has run.');
