(() => {
  const entities = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  function escapeHTML(strings, ...values) {
    return strings.reduce(
      (markup, text, index) =>
        markup +
        text +
        (index < values.length
          ? String(values[index]).replace(/[&<>"']/g, (c) => entities[c])
          : ''),
      '',
    );
  }

  function renderSignIn(container) {
    const shop = container.dataset.shop;
    container.innerHTML = escapeHTML`
      <div class="orbit-widget">
        <p class="orbit-brand">Orbit ID</p>
        <h2>Sign in to ${shop}</h2>
        <p>Use your Orbit ID account. You do not need a new password.</p>
        <button type="button">Continue with Orbit ID</button>
      </div>`;
    container
      .querySelector('button')
      .addEventListener('click', () => renderSignedIn(container));
  }

  function renderSignedIn(container) {
    container.innerHTML = escapeHTML`
      <div class="orbit-widget">
        <p class="orbit-brand">Orbit ID</p>
        <h2>Signed in as Elena</h2>
        <p>${container.dataset.shop} uses your saved address.</p>
      </div>`;
  }

  for (const container of document.querySelectorAll('[data-orbit-widget]')) {
    renderSignIn(container);
  }
})();
