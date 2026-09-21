// Shared port registry; second origins use app port + 100.
export const hub = { port: 4173 };

export const demos = [
  {
    id: 'trusted-types',
    port: 4201,
    summary: 'Trusted Types blocks strings in innerHTML.',
  },
  {
    id: 'script-src-eval',
    port: 4203,
    command: ['npm', 'start'],
    summary: 'script-src blocks eval, also in a webpack build.',
    note: 'The start script builds the webpack bundle first.',
  },
  {
    id: 'playwright-policies',
    port: 4204,
    summary:
      'Playwright runs the same page under two sets of security headers, and frame-ancestors keeps one route out of an iframe.',
    note: 'npm run test:strict fails on purpose. The HTML report holds the violation reports.',
  },
  {
    id: 'coop-popup',
    port: 4205,
    providerPort: 4305,
    summary: 'COOP cuts the window relationship of a popup login.',
  },
  {
    id: 'coop-broadcast-channel',
    port: 4206,
    providerPort: 4306,
    summary: 'A popup login that COOP does not break.',
  },
  {
    id: 'restrict-architecture-eslint',
    port: 4208,
    providerPort: 4308,
    summary:
      'Two lint rules keep every API call inside the connect-src contract.',
  },
  {
    id: 'reporting-api',
    port: 4209,
    providerPort: 4309,
    summary: 'Report-only policies and browser reports.',
    note: 'Chromium sends reports over HTTPS only. Run "npm start" in demos/reporting-api for the HTTPS launcher.',
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
