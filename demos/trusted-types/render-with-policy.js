import { escapeHtml } from './render-with-escape.js';

let policy;

function policyHtml(strings, ...values) {
  if (!policy) {
    policy = trustedTypes.createPolicy('my-widget', {
      createHTML: (markup) => markup,
    });
  }
  return policy.createHTML(escapeHtml(strings, ...values));
}

export function render(container) {
  container.innerHTML = policyHtml`
    <div class="orbit-widget">
      <p class="orbit-brand">Orbit ID</p>
      <h2>Sign in to ${container.dataset.shop}</h2>
      <p>Use your Orbit ID account. You do not need a new password.</p>
      <button type="button">Continue with Orbit ID</button>
    </div>`;
}
