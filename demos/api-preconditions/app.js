import { apis } from './preconditions.js';
import { modes, defaultMode } from './routes.js';

const mode =
  modes.find((route) => route.path === location.pathname) ?? defaultMode;

// A call can wait for a permission prompt that nobody answers, so every run
// gets a time limit.
const limit = (promise) =>
  Promise.race([
    promise,
    new Promise((resolve, reject) =>
      setTimeout(() => reject(new Error('no answer in 5 seconds')), 5000),
    ),
  ]);

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// The state of one permission, or a short reason why the browser cannot say.
async function permissionState(name) {
  if (!name) return 'no permission needed';
  try {
    const status = await navigator.permissions.query({ name });
    return `permission: ${status.state}`;
  } catch {
    return 'permission: this browser cannot report it';
  }
}

// Runs one API and writes what came back into one output.
async function runInto(output, api) {
  output.className = 'result';
  output.textContent = 'running…';
  try {
    output.textContent = await limit(api.run());
    output.className = 'result works';
  } catch (failure) {
    output.textContent = `${failure.name}: ${failure.message}`;
    output.className = 'result blocked';
  }
  showActivation();
}

function card(api) {
  const item = element('li', 'api');
  item.id = `api-${api.id}`;
  item.append(element('h2', null, api.call));
  item.append(element('p', 'needs', `Needs: ${api.needs.join(', ')}`));

  const state = element('p', 'permission', '…');
  permissionState(api.permission).then((text) => {
    state.textContent = text;
  });
  item.append(state);

  const results = element('dl', 'results');
  const onLoad = element('output', 'result', '…');
  const afterClick = element('output', 'result', 'not run yet');
  for (const [label, output] of [
    ['On load, without a click', onLoad],
    ['From a click', afterClick],
  ]) {
    const value = element('dd');
    value.append(output);
    results.append(element('dt', null, label), value);
  }
  item.append(results);

  const button = element('button', 'run', 'Run from this click');
  button.addEventListener('click', () => runInto(afterClick, api));
  const link = element('a', 'mdn', 'MDN');
  link.href = api.mdn;
  link.target = '_blank';
  link.rel = 'noreferrer';
  const actions = element('p', 'actions');
  actions.append(button, link);
  item.append(actions);

  return { item, onLoad, afterClick };
}

function showActivation() {
  const activation = navigator.userActivation;
  document.querySelector('#sticky').textContent = activation.hasBeenActive
    ? 'yes'
    : 'no';
  document.querySelector('#transient').textContent = activation.isActive
    ? 'yes'
    : 'no';
}

function showEnvironment() {
  document.querySelector('#mode').textContent = mode.title;
  const headers = Object.entries(mode.headers)
    .map(([name, value]) => `${name}: ${value}`)
    .join(' — ');
  document.querySelector('#headers').textContent = headers || 'none';
  document.querySelector('#secure').textContent = isSecureContext
    ? 'yes'
    : 'no';
  document.querySelector('#isolated').textContent = crossOriginIsolated
    ? 'yes'
    : 'no';
  showActivation();
}

showEnvironment();

const list = document.querySelector('#apis');
const rows = apis.map((api) => {
  const { item, onLoad, afterClick } = card(api);
  list.append(item);
  return { api, onLoad, afterClick };
});

// The load pass: the same calls, with no user activation behind them.
for (const { api, onLoad } of rows) runInto(onLoad, api);

// One click, every API. The click gives the whole page transient activation.
document.querySelector('#run-all').addEventListener('click', () => {
  for (const { api, afterClick } of rows) runInto(afterClick, api);
});
