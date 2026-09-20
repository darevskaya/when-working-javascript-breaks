// Ask the browser for a Trusted Types policy, and show the answer of the page.
// A policy is the one way to turn a string into markup that a sink accepts.
export function reportPolicy(name) {
  const status = document.querySelector('#status');
  if (!globalThis.trustedTypes) {
    status.textContent = 'This browser has no Trusted Types.';
    return;
  }
  try {
    globalThis.trustedTypes.createPolicy(name, { createHTML: (m) => m });
    status.textContent = `The page allows a policy named "${name}".`;
  } catch (error) {
    status.className = 'blocked';
    status.textContent = `The page refuses a policy named "${name}". ${error.message}`;
  }
}
