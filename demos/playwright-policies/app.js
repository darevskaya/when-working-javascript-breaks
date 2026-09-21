// Two small features, and the reports the browser makes about them. One
// feature needs a Content Security Policy directive, the other needs a
// permissions policy. Nothing here draws anything, because the demo is about
// the test run, not about the feature.

const say = (id, text, blocked) => {
  const element = document.querySelector(id);
  element.textContent = text;
  element.className = blocked ? 'blocked' : 'allowed';
};

// ---------------------------------------------------------------------------
// The reports. A ReportingObserver receives what the browser would send to a
// reporting endpoint, so the page reads what production monitoring reads.
// Without the types option it collects every kind, and buffered: true
// delivers the reports the browser made before this line ran.
// ---------------------------------------------------------------------------

const list = document.querySelector('#reports');

// One line per report, whatever the kind.
const describe = ({ type, body }) =>
  type === 'csp-violation'
    ? `${type}: ${body.effectiveDirective} blocked ${body.blockedURL}`
    : `${type}: ${body.featureId ?? body.id ?? body.message}`;

window.reports = [];

new ReportingObserver(
  (reports) => {
    for (const report of reports) {
      window.reports.push(report.toJSON());
      const item = document.createElement('li');
      item.textContent = describe(report);
      list.append(item);
    }
    document.querySelector('#reports-empty').hidden = window.reports.length > 0;
  },
  { buffered: true },
).observe();

// ---------------------------------------------------------------------------
// Feature 1: a Worker that carries its code in a Blob URL. The page needs
// blob: in worker-src. A policy with no worker directive falls back to
// child-src, then to script-src, so a plain script-src 'self' blocks this.
// ---------------------------------------------------------------------------

const source = 'onmessage = (event) => postMessage(`Hello, ${event.data}.`);';

// The Worker constructor does not throw on a blocked URL. The browser creates
// the object and then fires an error event, and an error event alone does not
// say why. The violation event does, so the page listens for it and tells a
// blocked worker from a broken one.
let blocked = false;

document.addEventListener('securitypolicyviolation', (event) => {
  if (event.effectiveDirective !== 'worker-src') return;
  blocked = true;
  say(
    '#worker-status',
    `The browser refused the worker: ${event.effectiveDirective} blocked ${event.blockedURI}:`,
    true,
  );
});

function startWorker() {
  const blob = new Blob([source], { type: 'text/javascript' });
  const url = URL.createObjectURL(blob);
  const worker = new Worker(url);
  URL.revokeObjectURL(url);
  worker.onmessage = ({ data }) => {
    say('#worker-status', `The worker replied: ${data}`, false);
    worker.terminate();
  };
  worker.onerror = () => {
    if (!blocked) say('#worker-status', 'The worker failed.', true);
  };
  worker.postMessage('Playwright');
}

// ---------------------------------------------------------------------------
// Feature 2: geolocation. Permissions-Policy: geolocation=() turns it off for
// the page, and the browser makes a permissions-policy-violation report.
// ---------------------------------------------------------------------------

function askForLocation() {
  const policy = document.permissionsPolicy ?? document.featurePolicy;
  const allowed = policy?.allowsFeature('geolocation') ?? true;
  say(
    '#geolocation-status',
    allowed
      ? 'The permissions policy allows geolocation.'
      : 'The permissions policy blocks geolocation.',
    !allowed,
  );
  // The call itself is what makes the browser write the report.
  navigator.geolocation.getCurrentPosition(
    () => {},
    () => {},
  );
}

startWorker();
askForLocation();
