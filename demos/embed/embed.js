import { embedOrbitFrame } from '/orbit-loader.js';
import { providerOrigin } from '/embed-config.js';

// The shop's own embed code. Each route stands for one customer
// configuration, and the configurations differ only in the sandbox attribute.
const base = 'allow-scripts allow-same-origin';
const sandboxes = {
  'no-sandbox': null,
  'no-top-navigation': base,
  'user-activation': `${base} allow-top-navigation-by-user-activation`,
};
const sandbox = sandboxes[location.pathname.split('/').pop()];

const iframe = document.createElement('iframe');
iframe.title = 'Orbit ID sign-in';
// Set the sandbox before the src. The flags apply when the frame navigates.
if (sandbox) iframe.setAttribute('sandbox', sandbox);
const user = embedOrbitFrame(iframe);

// Show the tag the customer wrote, so the audience can read the attribute.
const tag = `<iframe src="${providerOrigin}/embed?…"`;
document.querySelector('#embed-code').textContent = sandbox
  ? `${tag}\n        sandbox="${sandbox}">`
  : `${tag}>`;
document.querySelector('#status').textContent = user
  ? `Orbit ID returned the user ${user}.`
  : 'No user yet. The shop sees no error.';
document.querySelector('#orbit-slot').append(iframe);
