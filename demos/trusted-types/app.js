// The Orbit ID sign-in widget, in four styles. The last part of the URL picks
// one, so this one file holds every version that the demo shows.
//
//   string  container.innerHTML = `…`             a plain string
//   escape  container.innerHTML = escapeHtml`…`   every value escaped
//   policy  container.innerHTML = policyHtml`…`   through a Trusted Types policy
//   dom     createElement() and textContent       no markup at all
//
// Each lint configuration in this folder allows one of them. See README.md.

// ---------------------------------------------------------------------------
// The two helpers that the lint rules look for.
// ---------------------------------------------------------------------------

const entities = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

// Turns the five markup characters of one value into entities.
const escapeValue = (value) =>
  String(value).replace(/[&<>"']/g, (character) => entities[character]);

// A tagged template. The text around the values is the page's own, and each
// value is escaped, so a value can never open a tag. This stops injection.
// It does not satisfy Trusted Types, because the result is still a string.
function escapeHtml(strings, ...values) {
  return strings.reduce(
    (markup, text, index) =>
      markup + text + (index < values.length ? escapeValue(values[index]) : ''),
    '',
  );
}

// The same template through the policy named orbit-widget. The page must name
// that policy in its trusted-types list, or createPolicy throws. The result is
// a TrustedHTML object, and a markup sink accepts it.
let policy;
function policyHtml(strings, ...values) {
  policy ??= globalThis.trustedTypes.createPolicy('orbit-widget', {
    createHTML: (markup) => markup,
  });
  return policy.createHTML(escapeHtml(strings, ...values));
}

// ---------------------------------------------------------------------------
// Style 1, string: the original widget. The shop name goes into the markup as
// it is, so a shop name that holds a tag becomes a tag.
// ---------------------------------------------------------------------------

function renderString(container) {
  container.innerHTML = `
    <div class="orbit-widget">
      <p class="orbit-brand">Orbit ID</p>
      <h2>Sign in to ${container.dataset.shop}</h2>
      <p>Use your Orbit ID account. You do not need a new password.</p>
      <button type="button">Continue with Orbit ID</button>
    </div>`;
}

// ---------------------------------------------------------------------------
// Style 2, escape: the same markup, with every value escaped.
// ---------------------------------------------------------------------------

function renderEscape(container) {
  container.innerHTML = escapeHtml`
    <div class="orbit-widget">
      <p class="orbit-brand">Orbit ID</p>
      <h2>Sign in to ${container.dataset.shop}</h2>
      <p>Use your Orbit ID account. You do not need a new password.</p>
      <button type="button">Continue with Orbit ID</button>
    </div>`;
}

// ---------------------------------------------------------------------------
// Style 3, policy: the same markup again, through the Trusted Types policy.
// ---------------------------------------------------------------------------

function renderPolicy(container) {
  container.innerHTML = policyHtml`
    <div class="orbit-widget">
      <p class="orbit-brand">Orbit ID</p>
      <h2>Sign in to ${container.dataset.shop}</h2>
      <p>Use your Orbit ID account. You do not need a new password.</p>
      <button type="button">Continue with Orbit ID</button>
    </div>`;
}

// ---------------------------------------------------------------------------
// Style 4, dom: no markup at all. Each node comes from createElement(), and
// each value goes in with textContent.
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// The route picks the style, and the page reports what happened.
// ---------------------------------------------------------------------------

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
