import { render } from './eval-renderer.js';

// The order, and the values that the templates read.
const data = {
  lines: [
    { name: 'Monstera, medium', price: 38, quantity: 1 },
    { name: 'Terracotta pot', price: 14, quantity: 1 },
  ],
  subtotal() {
    return this.lines.reduce(
      (sum, line) => sum + line.price * line.quantity,
      0,
    );
  },
  delivery() {
    return this.subtotal() >= 50 ? 0 : 4.9;
  },
  total() {
    return this.subtotal() + this.delivery();
  },
};

// Each marked element holds its own template. If a template fails, its
// {{ … }} text stays on the page.
for (const element of document.querySelectorAll('[data-template]')) {
  element.textContent = render(element.textContent, data);
}
