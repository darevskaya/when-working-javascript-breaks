import { setHTML } from 'trusted-html';
import { reportPolicy } from './policy-probe.js';

// The page sends trusted-types orbit-widget, and setHTML() in the trusted-html
// package owns that policy. setHTML() escapes each value, so the widget keeps
// its templates and this file touches no markup sink.

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

// The list names orbit-widget and nothing else, so a second name fails.
reportPolicy('shop-widget');
