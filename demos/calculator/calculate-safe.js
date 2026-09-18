// The same calculations as regular functions. This file has no eval, so lint
// passes. The eval build still breaks, because webpack adds eval to the bundle.
const calculations = {
  subtotal: (price, quantity) => price * quantity,
  discount: (price, quantity) => price * quantity * 0.9,
  tax: (price, quantity) => price * quantity * 1.2,
};

export function createCalculator(operation) {
  return calculations[operation];
}
