// Shared port registry; second origins use app port + 100.
export const hub = { port: 4173 };

export const demos = [
  {
    id: 'restrict-inner-html',
    port: 4201,
    summary: 'Trusted Types blocks innerHTML.',
  },
  {
    id: 'script-src-eval',
    port: 4203,
    summary: 'CSP blocks eval.',
    note: 'The start script builds the webpack bundle first.',
  },
  {
    id: 'playwright-policies',
    port: 4204,
    summary: 'Playwright tests under security headers.',
    note: 'npm run test:strict fails on purpose. The HTML report holds the violation reports.',
  },
  {
    id: 'coop-popup',
    port: 4205,
    providerPort: 4305,
    summary: 'COOP breaks popup login.',
  },
  {
    id: 'restrict-architecture-eslint',
    port: 4208,
    providerPort: 4308,
    summary: 'ESLint enforces connect-src.',
  },
  {
    id: 'reporting-api',
    port: 4209,
    providerPort: 4309,
    summary: 'Report-only headers and browser reports.',
    note: 'Chromium sends reports over HTTPS only. Run "npm start" in demos/reporting-api for the HTTPS launcher.',
  },
  {
    id: 'worker-src-eslint',
    port: 4210,
    summary: 'ESLint enforces worker-src.',
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
