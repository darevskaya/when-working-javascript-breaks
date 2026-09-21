// Fills the {{ … }} templates on the page. The templates and the data are the
// page's own, so the code looks safe. script-src without 'unsafe-eval' blocks
// it anyway.
export function render(template, data) {
  return template.replace(/\{\{([\s\S]+?)\}\}/g, (_, expression) =>
    String(eval(expression)),
  );
}
