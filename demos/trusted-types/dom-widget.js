import { reportPolicy } from './policy-probe.js';

// The page sends trusted-types 'none', so the browser allows no policy. No
// string can become markup here. The widget builds each node and writes each
// value with textContent.

function node(tag, text, className) {
  const element = document.createElement(tag);
  if (text) element.textContent = text;
  if (className) element.className = className;
  return element;
}

function card(...children) {
  const box = node('div', '', 'orbit-widget');
  box.append(node('p', 'Orbit ID', 'orbit-brand'), ...children);
  return box;
}

function renderSignIn(container) {
  const button = node('button', 'Continue with Orbit ID');
  button.type = 'button';
  button.addEventListener('click', () => renderSignedIn(container));
  container.replaceChildren(
    card(
      node('h2', `Sign in to ${container.dataset.shop}`),
      node('p', 'Use your Orbit ID account. You do not need a new password.'),
      button,
    ),
  );
}

function renderSignedIn(container) {
  container.replaceChildren(
    card(
      node('h2', 'Signed in as Elena'),
      node('p', `${container.dataset.shop} uses your saved address.`),
    ),
  );
}

for (const container of document.querySelectorAll('[data-orbit-widget]')) {
  renderSignIn(container);
}

// 'none' refuses every name, the name of this widget included.
reportPolicy('orbit-widget');
