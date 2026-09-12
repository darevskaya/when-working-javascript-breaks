import { createCalculator } from './calculate.js';

export function openCalculatorDialog() {
  const form = document.querySelector('#order-form');
  // Compile the formula on opening, before showing the dialog.
  let calculate = createCalculator(form.elements.operation.value);
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
  form.elements.operation.onchange = () => {
    calculate = createCalculator(form.elements.operation.value);
  };

  document.querySelector('#calculator-dialog').showModal();
}
