import { setHTML } from 'trusted-html';

// The Orbit ID widget from innerhtml-string.js. It keeps its templates, but it
// writes them through setHTML() from the trusted-html package, so this file
// touches no markup sink.

function renderSignIn(container) {
  const shop = container.dataset.shop;
  setHTML(container)`
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
  setHTML(container)`
    <div class="orbit-widget">
      <p class="orbit-brand">Orbit ID</p>
      <h2>Signed in as Elena</h2>
      <p>${container.dataset.shop} uses your saved address.</p>
    </div>`;
}

for (const container of document.querySelectorAll('[data-orbit-widget]')) {
  renderSignIn(container);
}
