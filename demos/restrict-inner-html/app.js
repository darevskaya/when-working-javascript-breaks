import { render as renderString } from './render-with-string.js';
import { render as renderPolicy } from './render-with-policy.js';
import { render as renderDom } from './render-with-dom.js';

const renderers = {
  'no-header': renderString,
  string: renderString,
  policy: renderPolicy,
  dom: renderDom,
};

const route = location.pathname.split('/').pop();
const render = renderers[route] ?? renderString;
const result = document.querySelector('#status');

document.querySelector('#style').textContent = route;

try {
  for (const container of document.querySelectorAll('[data-orbit-widget]')) {
    render(container);
  }
  result.textContent = 'The widget rendered.';
} catch (error) {
  result.className = 'blocked';
  result.textContent = `The browser refused the write. ${error.name}: ${error.message}`;
}
