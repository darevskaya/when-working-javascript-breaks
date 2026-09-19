// The Orbit ID widget from widget.js, with a Trusted Types policy. The templates
// and the innerHTML assignments stay. The html tagged template escapes each
// value, and the policy turns the result into TrustedHTML, which
// require-trusted-types-for 'script' accepts.
// The policy object stays inside this function, so html`` is its only
// caller. That is why createHTML can pass the markup through unchanged.
// If the page's CSP also has a trusted-types directive, it must name
// orbit-widget, or createPolicy throws. That belongs in the embedding contract.
// https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API
(() => {
  const policy = window.trustedTypes?.createPolicy('orbit-widget', {
    createHTML: (markup) => markup,
  });

  const entities = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  function html(strings, ...values) {
    const markup = strings.reduce(
      (result, text, index) =>
        result +
        text +
        (index < values.length
          ? String(values[index]).replace(/[&<>"']/g, (c) => entities[c])
          : ''),
      '',
    );
    // A browser without Trusted Types gets the escaped string.
    return policy ? policy.createHTML(markup) : markup;
  }

  function renderSignIn(container) {
    const shop = container.dataset.shop;
    container.innerHTML = html` <div class="orbit-widget">
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
    container.innerHTML = html` <div class="orbit-widget">
      <p class="orbit-brand">Orbit ID</p>
      <h2>Signed in as Elena</h2>
      <p>${container.dataset.shop} uses your saved address.</p>
    </div>`;
  }

  for (const container of document.querySelectorAll('[data-orbit-widget]')) {
    renderSignIn(container);
  }
})();
