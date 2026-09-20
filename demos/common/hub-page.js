import { demos } from '/demos.js';

const list = document.querySelector('#demos');

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// One request per demo tells the page which servers are up.
async function isUp(origin) {
  try {
    await fetch(`${origin}/`, { mode: 'no-cors', cache: 'no-store' });
    return true;
  } catch {
    return false;
  }
}

for (const entry of demos) {
  const origin = `http://127.0.0.1:${entry.port}`;
  const item = element('li', 'demo');

  const link = element('a', null, entry.id);
  link.href = origin;
  const heading = element('h2');
  heading.append(link);
  item.append(heading);

  item.append(element('p', 'summary', entry.summary));

  const ports = entry.providerPort
    ? `port ${entry.port}, second origin on port ${entry.providerPort}`
    : `port ${entry.port}`;
  item.append(element('p', 'ports', ports));

  if (entry.note) item.append(element('p', 'note', entry.note));

  const state = element('p', 'state', 'checking…');
  item.append(state);
  isUp(origin).then((up) => {
    state.textContent = up ? 'running' : 'not running';
    state.className = up ? 'state up' : 'state down';
    item.className = up ? 'demo' : 'demo off';
  });

  list.append(item);
}
