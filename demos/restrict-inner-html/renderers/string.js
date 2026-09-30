export function render(container) {
  container.innerHTML = `
    <div class="product-preview">
      <p class="preview-label">Product label</p>
      <p class="product-name">${container.dataset.label}</p>
    </div>`;
}
