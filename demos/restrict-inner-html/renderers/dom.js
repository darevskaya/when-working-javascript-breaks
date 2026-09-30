function node(tag, text, className) {
  const element = document.createElement(tag);
  if (text) element.textContent = text;
  if (className) element.className = className;
  return element;
}

export function render(container) {
  const card = node('div', '', 'product-preview');
  card.append(
    node('p', 'Product label', 'preview-label'),
    node('p', container.dataset.label, 'product-name'),
  );
  container.replaceChildren(card);
}
