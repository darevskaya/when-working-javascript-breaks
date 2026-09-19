// The same Orbit ID widget as sdk.js, built with DOM APIs. The shop name goes
// in as textContent, so no string becomes markup. This file has no innerHTML,
// so lint passes, and require-trusted-types-for 'script' has nothing to stop.
(() => {
  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function card(title, text) {
    const widget = element('div', 'orbit-widget');
    widget.append(
      element('p', 'orbit-brand', 'Orbit ID'),
      element('h2', '', title),
      element('p', '', text),
    );
    return widget;
  }

  function renderSignIn(container) {
    const shop = container.dataset.shop;
    const widget = card(
      `Sign in to ${shop}`,
      'Use your Orbit ID account. You do not need a new password.',
    );
    const button = element('button', '', 'Continue with Orbit ID');
    button.type = 'button';
    button.addEventListener('click', () => renderSignedIn(container));
    widget.append(button);
    container.replaceChildren(widget);
  }

  function renderSignedIn(container) {
    container.replaceChildren(
      card(
        'Signed in as Elena',
        `${container.dataset.shop} uses your saved address.`,
      ),
    );
  }

  for (const container of document.querySelectorAll('[data-orbit-widget]')) {
    renderSignIn(container);
  }
})();
