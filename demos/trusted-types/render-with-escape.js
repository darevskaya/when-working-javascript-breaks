const entities = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

const escapeValue = (value) =>
  String(value).replace(/[&<>"']/g, (character) => entities[character]);

export function escapeHtml(strings, ...values) {
  return strings.reduce(
    (markup, text, index) =>
      markup + text + (index < values.length ? escapeValue(values[index]) : ''),
    '',
  );
}

export function render(container) {
  container.innerHTML = escapeHtml`
    <div class="orbit-widget">
      <p class="orbit-brand">Orbit ID</p>
      <h2>Sign in to ${container.dataset.shop}</h2>
      <p>Use your Orbit ID account. You do not need a new password.</p>
      <button type="button">Continue with Orbit ID</button>
    </div>`;
}
