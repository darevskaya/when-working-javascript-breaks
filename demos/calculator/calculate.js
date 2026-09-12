export function createCalculator(useFunction) {
  if (useFunction) {
    return new Function('price', 'quantity', 'return price * quantity;');
  }

  return function calculate(price, quantity) {
    return price * quantity;
  };
}
