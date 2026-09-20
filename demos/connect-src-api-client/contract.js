// The connect-src contract: the API origins that this app may call. The
// customer's connect-src must list each one. server.js sends the same list in
// its policy, and eslint.config.js allows only these origins in config.js.
export const apiOrigins = ['http://127.0.0.1:4174'];

// The API server always uses this port, because config.js names it.
export const apiPort = 4174;
