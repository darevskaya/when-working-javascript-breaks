const policy = globalThis.trustedTypes?.createPolicy('orbit-widget', {
  createHTML: (markup) => markup,
});

const entities = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};
const escape = (value) =>
  String(value).replace(/[&<>"']/g, (character) => entities[character]);

export function setHTML(element) {
  return (strings, ...values) => {
    const markup = strings.reduce(
      (result, text, index) =>
        result + text + (index < values.length ? escape(values[index]) : ''),
      '',
    );
    // A browser without Trusted Types gets the escaped string.
    element.innerHTML = policy ? policy.createHTML(markup) : markup;
  };
}
