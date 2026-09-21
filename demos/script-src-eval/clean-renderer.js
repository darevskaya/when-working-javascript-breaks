const expressions = {
  'data.lines.length': (data) => data.lines.length,
  'data.subtotal().toFixed(2)': (data) => data.subtotal().toFixed(2),
  "data.delivery() ? '$4.90' : 'Free'": (data) =>
    data.delivery() ? '$4.90' : 'Free',
  'data.total().toFixed(2)': (data) => data.total().toFixed(2),
};

// Webpack substitutes this renderer to isolate devtool-generated eval.
export function render(template, data) {
  return template.replace(/\{\{([\s\S]+?)\}\}/g, (_, expression) =>
    String(expressions[expression.trim()](data)),
  );
}
