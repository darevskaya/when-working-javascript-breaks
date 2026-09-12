const controls = document.querySelector('#controls');

function syncControls() {
  controls.elements.policy.value = location.pathname.endsWith('/restricted')
    ? 'restricted'
    : 'permissive';
  controls.elements.build.value =
    new URLSearchParams(location.search).get('build') === 'fixed'
      ? 'fixed'
      : 'eval';
}

// Restore selections from the URL, including browser Back and Forward.
syncControls();
window.addEventListener('pageshow', syncControls);

controls.addEventListener('change', () => {
  const policy = controls.elements.policy.value;
  const build = controls.elements.build.value;

  // A full navigation lets the browser apply the new response's CSP.
  location.assign(`/demo/eval/${policy}?build=${build}`);
});
