// CSP blocks eval even for the page's own templates.
export function render(template, data) {
  return template.replace(/\{\{([\s\S]+?)\}\}/g, (_, expression) =>
    String(eval(expression)),
  );
}
