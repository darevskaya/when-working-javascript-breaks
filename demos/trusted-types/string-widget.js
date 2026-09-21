// The original Orbit ID sign-in widget. No page loads it. It is the code that
// dom-widget.js and policy-widget.js replace, and lint flags its two
// innerHTML lines. A page with require-trusted-types-for 'script' answers
// the same lines with a TypeError.
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
