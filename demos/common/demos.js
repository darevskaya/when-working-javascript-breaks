// Every demo in this repository, with the ports it uses. The hub page, the
// start script, the stop script, and each demo server read this one list, so
// two demos can run at the same time without a port collision.
//
// An app port is 42xx. The provider port of the same demo is that port plus
// 100. A provider is a second origin: Orbit ID, an API, or a report receiver.

// The hub page that links to every demo.
export const hub = { port: 4173 };

export const demos = [
  {
    id: 'trusted-types',
    port: 4201,
    summary: 'Trusted Types blocks strings in innerHTML.',
  },
  {
    id: 'iframe-sandbox',
    port: 4202,
    providerPort: 4302,
    summary: 'A sandboxed frame needs a token to redirect the page.',
  },
  {
    id: 'script-src-eval',
    port: 4203,
    command: ['npm', 'start'],
    summary: 'script-src blocks eval, also in a webpack build.',
    note: 'The start script builds the webpack bundle first.',
  },
  {
    id: 'worker-src-blob',
    port: 4204,
    summary: 'worker-src blocks a Worker that starts from a Blob URL.',
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
    id: 'connect-src',
    port: 4207,
    summary: 'connect-src blocks an API host.',
  },
  {
    id: 'connect-src-api-client',
    port: 4208,
    providerPort: 4308,
    summary: 'Lint keeps every API call inside the connect-src contract.',
  },
  {
    id: 'reporting-api',
    port: 4209,
    providerPort: 4309,
    summary: 'Report-only policies and browser reports.',
    note: 'Chromium sends reports over HTTPS only. Run "npm start" in demos/reporting-api for the HTTPS launcher.',
  },
  {
    id: 'api-preconditions',
    port: 4210,
    summary: 'What eleven different APIs need before they run.',
  },
];

// The registry entry of one demo, by folder name.
export function demo(id) {
  const found = demos.find((entry) => entry.id === id);
  if (!found) throw new Error(`No demo named ${id} in demos/common/demos.js.`);
  return found;
}

// Every port that a demo or the hub can listen on.
export const allPorts = [
  hub.port,
  ...demos.flatMap(({ port, providerPort }) =>
    providerPort ? [port, providerPort] : [port],
  ),
];
