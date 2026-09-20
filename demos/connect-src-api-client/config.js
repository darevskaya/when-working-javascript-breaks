// Every API origin that the page code uses. Only this file may name an origin,
// and each origin must be in contract.js.
export const config = {
  apiOrigin: 'http://127.0.0.1:4174',
  // Added later, without a change to the contract. Lint flags it.
  metricsOrigin: 'https://metrics.example.net',
};
