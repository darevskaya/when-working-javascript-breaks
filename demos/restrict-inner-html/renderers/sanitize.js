import DOMPurify from '/purify.js';

export function sanitizeHtml(markup) {
  return DOMPurify.sanitize(markup, { RETURN_TRUSTED_TYPE: true });
}

export function render(container) {
  container.innerHTML = sanitizeHtml(`
    <div class="product-preview">
      <p class="preview-label">Product label</p>
      <p class="product-name">${container.dataset.label}</p>
    </div>`);
}
