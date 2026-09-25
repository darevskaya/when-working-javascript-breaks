import DOMPurify from '/purify.js';

// Removes scripts, event handlers, and other active content from the markup,
// then returns it as TrustedHTML from the dompurify policy.
export function sanitizeHtml(markup) {
  return DOMPurify.sanitize(markup, { RETURN_TRUSTED_TYPE: true });
}

export function render(container) {
  container.innerHTML = sanitizeHtml(`
    <div class="orbit-widget">
      <p class="orbit-brand">Orbit ID</p>
      <h2>Sign in to ${container.dataset.shop}</h2>
      <p>Use your Orbit ID account. You do not need a new password.</p>
      <button type="button">Continue with Orbit ID</button>
    </div>`);
}
