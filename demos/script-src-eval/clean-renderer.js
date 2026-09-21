// The same renderer as eval-renderer.js, without eval. Each template expression
// on the page is a regular function here, so lint passes. webpack builds the
// bundle from this file. The bundle can still contain eval, because the
// eval-source-map devtool wraps every module in eval(). See webpack.config.js.
const expressions = {
  'data.lines.length': (data) => data.lines.length,
  'data.subtotal().toFixed(2)': (data) => data.subtotal().toFixed(2),
  "data.delivery() ? '$4.90' : 'Free'": (data) =>
    data.delivery() ? '$4.90' : 'Free',
  'data.total().toFixed(2)': (data) => data.total().toFixed(2),
};

export function render(template, data) {
  return template.replace(/\{\{([\s\S]+?)\}\}/g, (_, expression) =>
    String(expressions[expression.trim()](data)),
  );
}
