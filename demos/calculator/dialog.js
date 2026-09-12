import { createCalculator } from './calculate.js';

export function openCalculatorDialog(useFunction) {
  // Compile the formula on opening, before showing the dialog.
  const calculate = createCalculator(useFunction);
  const form = document.querySelector('#order-form');
  const total = document.querySelector('#total');
  const currency = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  form.onsubmit = (event) => {
    event.preventDefault();
    const price = form.elements.price.valueAsNumber;
    const quantity = form.elements.quantity.valueAsNumber;
    total.textContent = `Total: ${currency.format(calculate(price, quantity))}`;
  };
  form.oninput = () => {
    total.textContent = 'Total: —';
  };

  document.querySelector('#calculator-dialog').showModal();
}
