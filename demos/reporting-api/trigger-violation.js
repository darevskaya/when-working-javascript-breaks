import { secondOrigin } from '/reporting-config.js';

// The route is /demo/reporting/<policy>/<mode>.
const [policy, mode] = location.pathname.split('/').slice(-2);
const status = document.querySelector('#status');

// The blocked state is the point of the demo, so it gets the large red style.
function show(blocked, message) {
  status.classList.toggle('blocked', blocked);
  status.textContent = `${message} Waiting for the report in the terminal.`;
}

// Says what the action is, then does it. One row per policy, the same shape as
// the route table in server.js.
const examples = {
  csp: {
    description:
      'Insert an inline script. The policy permits scripts from this origin but forbids inline scripts.',
    trigger() {
      window.inlineScriptRan = false;
      const script = document.createElement('script');
      script.textContent = 'window.inlineScriptRan = true;';
      document.body.append(script);
      script.remove();
      const ran = window.inlineScriptRan;
      show(!ran, ran ? 'Inline script ran.' : 'Inline script blocked.');
    },
  },
  coop: {
    description:
      'Open a popup on the second origin. Enforced isolation disconnects the opener from the popup.',
    trigger() {
      const popup = window.open(
        `${secondOrigin}/reporting-popup`,
        '_blank',
        'popup,width=500,height=350',
      );
      if (!popup) {
        status.textContent = 'Allow popups, then try again.';
        return;
      }
      // An opener keeps a handle to a connected popup, and loses it to an
      // isolated one. Read the handle after the popup loads.
      setTimeout(() => {
        show(
          popup.closed,
          `popup.closed: ${popup.closed}. Close the popup after this example.`,
        );
      }, 1000);
    },
  },
  coep: {
    description:
      'Load a script from the second origin without its permission for cross-origin embedding.',
    trigger() {
      const script = document.createElement('script');
      script.src = `${secondOrigin}/reporting-resource.js`;
      script.onload = () => show(false, 'Cross-origin script loaded.');
      script.onerror = () => show(true, 'Cross-origin script blocked.');
      document.body.append(script);
    },
  },
};

const example = examples[policy];
document.querySelector('#title').textContent =
  `${policy.toUpperCase()} · ${mode}`;
document.querySelector('#description').textContent = example.description;
document.querySelector('#trigger').addEventListener('click', example.trigger);
