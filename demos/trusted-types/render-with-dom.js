function node(tag, text, className) {
  const element = document.createElement(tag);
  if (text) element.textContent = text;
  if (className) element.className = className;
  return element;
}

export function render(container) {
  const button = node('button', 'Continue with Orbit ID');
  button.type = 'button';
  const card = node('div', '', 'orbit-widget');
  card.append(
    node('p', 'Orbit ID', 'orbit-brand'),
    node('h2', `Sign in to ${container.dataset.shop}`),
    node('p', 'Use your Orbit ID account. You do not need a new password.'),
    button,
  );
  container.replaceChildren(card);
}
