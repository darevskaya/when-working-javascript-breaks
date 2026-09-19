// A tiny template renderer. Each {{ expression }} in the text is JavaScript
// that reads the data object, for example {{ data.total().toFixed(2) }}.
// The templates are in our own HTML, and the data is our own, so no user
// input reaches eval. It still needs 'unsafe-eval': script-src 'self' blocks
// eval itself, whatever the string holds. Template libraries that compile
// expressions from strings have the same need, for example Alpine.js and
// the Vue build with the template compiler. Both publish CSP builds.
export function render(template, data) {
  return template.replace(/\{\{([\s\S]+?)\}\}/g, (_, expression) =>
    String(eval(expression)),
  );
}
