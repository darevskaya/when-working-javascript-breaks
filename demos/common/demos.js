export const hub = { port: 4173 };

export const demos = [
  {
    id: 'coop-popup',
    port: 4205,
    providerPort: 4305,
    summary: 'COOP breaks popup login.',
  },
  {
    id: 'worker-src-eslint',
    port: 4210,
    summary: 'ESLint enforces worker-src.',
  },
  {
    id: 'script-src-eval',
    port: 4203,
    summary: 'script-src blocks eval.',
    note: 'The start script builds the webpack bundle first.',
  },
  {
    id: 'restrict-architecture-eslint',
    port: 4208,
    summary: 'ESLint enforces worker factories.',
  },
  {
    id: 'restrict-inner-html',
    port: 4201,
    summary: 'Trusted Types blocks innerHTML.',
  },
  {
    id: 'playwright-policies',
    port: 4204,
    summary: 'Testing under security headers.',
    note: 'npm run test:strict fails on purpose. The HTML report holds the violation reports.',
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
