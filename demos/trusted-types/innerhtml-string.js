// The original Orbit ID sign-in widget. No page loads it. widget-escaped.js
// and widget-policy.js are changed copies of it, and the lint and Semgrep
// demos flag its two innerHTML lines. The markup is a template string in
// innerHTML, which require-trusted-types-for 'script' refuses with a
// TypeError.
(() => {
  function renderSignIn(container) {
    const shop = container.dataset.shop;
    container.innerHTML = `
      <div class="orbit-widget">
        <p class="orbit-brand">Orbit ID</p>
        <h2>Sign in to ${shop}</h2>
        <p>Use your Orbit ID account. You do not need a new password.</p>
        <button type="button">Continue with Orbit ID</button>
      </div>`;
    container
      .querySelector('button')
      .addEventListener('click', () => renderSignedIn(container));
  }

  function renderSignedIn(container) {
    container.innerHTML = `
      <div class="orbit-widget">
        <p class="orbit-brand">Orbit ID</p>
        <h2>Signed in as Elena</h2>
        <p>${container.dataset.shop} uses your saved address.</p>
      </div>`;
  }

  for (const container of document.querySelectorAll('[data-orbit-widget]')) {
    renderSignIn(container);
  }
})();
