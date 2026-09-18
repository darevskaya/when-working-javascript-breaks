const formulas = {
  subtotal: 'price * quantity',
  discount: 'price * quantity * 0.9',
  tax: 'price * quantity * 1.2',
};

// calculate-safe.js has the same calculations as regular functions.
export function createCalculator(operation) {
  return new Function('price', 'quantity', `return ${formulas[operation]};`);
}
