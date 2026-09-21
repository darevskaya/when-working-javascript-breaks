const entities = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

const escapeValue = (value) =>
  String(value).replace(/[&<>"']/g, (character) => entities[character]);

// Escaped values are still strings; Trusted Types rejects them.
function escapeHtml(strings, ...values) {
  return strings.reduce(
    (markup, text, index) =>
      markup + text + (index < values.length ? escapeValue(values[index]) : ''),
    '',
  );
}

// CSP must allow the orbit-widget policy.
let policy;
function policyHtml(strings, ...values) {
  policy ??= globalThis.trustedTypes.createPolicy('orbit-widget', {
    createHTML: (markup) => markup,
  });
  return policy.createHTML(escapeHtml(strings, ...values));
}

function renderString(container) {
  container.innerHTML = `
    <div class="orbit-widget">
      <p class="orbit-brand">Orbit ID</p>
      <h2>Sign in to ${container.dataset.shop}</h2>
      <p>Use your Orbit ID account. You do not need a new password.</p>
      <button type="button">Continue with Orbit ID</button>
    </div>`;
}

function renderEscape(container) {
  container.innerHTML = escapeHtml`
    <div class="orbit-widget">
      <p class="orbit-brand">Orbit ID</p>
      <h2>Sign in to ${container.dataset.shop}</h2>
      <p>Use your Orbit ID account. You do not need a new password.</p>
      <button type="button">Continue with Orbit ID</button>
    </div>`;
}

function renderPolicy(container) {
  container.innerHTML = policyHtml`
    <div class="orbit-widget">
      <p class="orbit-brand">Orbit ID</p>
      <h2>Sign in to ${container.dataset.shop}</h2>
      <p>Use your Orbit ID account. You do not need a new password.</p>
      <button type="button">Continue with Orbit ID</button>
    </div>`;
}

function node(tag, text, className) {
  const element = document.createElement(tag);
  if (text) element.textContent = text;
  if (className) element.className = className;
  return element;
}

function renderDom(container) {
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

const renderers = {
  'no-header': renderString,
  string: renderString,
  escape: renderEscape,
  policy: renderPolicy,
  dom: renderDom,
};

const route = location.pathname.split('/').pop();
const render = renderers[route] ?? renderString;
const status = document.querySelector('#status');

document.querySelector('#style').textContent = route;

try {
  for (const container of document.querySelectorAll('[data-orbit-widget]')) {
    render(container);
  }
  status.textContent = 'The widget rendered.';
} catch (error) {
  status.className = 'blocked';
  status.textContent = `The browser refused the write. ${error.name}: ${error.message}`;
}
