const formulas = {
  subtotal: 'price * quantity',
  discount: 'price * quantity * 0.9',
  tax: 'price * quantity * 1.2',
};

// Keep these regular functions for the later CSP-safe example.
// const calculations = {
//   subtotal: (price, quantity) => price * quantity,
//   discount: (price, quantity) => price * quantity * 0.9,
//   tax: (price, quantity) => price * quantity * 1.2,
// };

export function createCalculator(operation) {
  // Uncomment the object above and this return to use regular functions.
  // return calculations[operation];
  return new Function('price', 'quantity', `return ${formulas[operation]};`);
}
