// The three modes of this demo. Each mode is one page with one set of
// response headers, and the page reads this list to name the headers it got.
export const modes = [
  {
    id: 'plain',
    path: '/demo/api-preconditions/plain',
    title: 'No extra headers',
    headers: {},
  },
  {
    id: 'locked-down',
    path: '/demo/api-preconditions/locked-down',
    title: 'Permissions-Policy blocks four features',
    headers: {
      'Permissions-Policy':
        'geolocation=(), fullscreen=(), screen-wake-lock=(), clipboard-write=()',
    },
  },
  {
    id: 'isolated',
    path: '/demo/api-preconditions/isolated',
    title: 'Cross-origin isolated',
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
];

export const defaultMode = modes[0];
