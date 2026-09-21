export function render(template, data) {
  return template.replace(/\{\{([\s\S]+?)\}\}/g, (_, expression) =>
    String(new Function(`return (${expression})`)()),
  );
}
