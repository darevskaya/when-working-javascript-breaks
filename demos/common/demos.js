export const hub = { port: 4173 };

export const demos = [
  {
    id: 'coop-popup',
    port: 4205,
    providerPort: 4305,
    summary: 'Popup login breaks under COOP',
  },
  {
    id: 'script-src-eval',
    port: 4203,
    summary: 'script-src blocks eval',
    note: 'The start script builds the webpack bundle first.',
  },
  {
    id: 'restrict-architecture-eslint',
    port: 4208,
    summary: 'ESLint enforces worker factories',
    visible: false,
  },
  {
    id: 'restrict-inner-html',
    port: 4201,
    summary: 'Trusted Types blocks innerHTML',
  },
  {
    id: 'playwright-policies',
    port: 4204,
    summary: 'Testing under security headers',
    visible: false,
  },
];

export function demo(id) {
  const found = demos.find((entry) => entry.id === id);
  if (!found) throw new Error(`No demo named ${id} in demos/common/demos.js.`);
  return found;
}

export const allPorts = [
  hub.port,
  ...demos.flatMap(({ port, providerPort }) =>
    providerPort ? [port, providerPort] : [port],
  ),
];
