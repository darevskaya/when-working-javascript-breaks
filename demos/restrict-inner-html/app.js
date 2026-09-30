import { render as renderString } from './renderers/string.js';
import { render as renderPolicy } from './renderers/sanitize.js';
import { render as renderDom } from './renderers/dom.js';

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
  for (const container of document.querySelectorAll('[data-preview]')) {
    render(container);
  }
  result.textContent = 'The preview rendered.';
} catch (error) {
  result.className = 'blocked';
  result.textContent = `The browser refused the write. ${error.name}: ${error.message}`;
}
