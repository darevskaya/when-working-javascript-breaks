const entities = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => entities[character]);
}

let policy;
function policyHtml(markup) {
  if (!policy) {
    policy = trustedTypes.createPolicy('my-widget', {
      createHTML: (markup) => markup,
    });
  }
  return policy.createHTML(markup);
}

export function render(container) {
  container.innerHTML = policyHtml(`
    <div class="orbit-widget">
      <p class="orbit-brand">Orbit ID</p>
      <h2>Sign in to ${escapeHtml(container.dataset.shop)}</h2>
      <p>Use your Orbit ID account. You do not need a new password.</p>
      <button type="button">Continue with Orbit ID</button>
    </div>`);
}
