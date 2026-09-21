const say = (id, text, blocked) => {
  const element = document.querySelector(id);
  element.textContent = text;
  element.className = blocked ? 'blocked' : 'allowed';
};

const list = document.querySelector('#reports');

const describe = ({ type, body }) =>
  type === 'csp-violation'
    ? `${type}: ${body.effectiveDirective} blocked ${body.blockedURL}`
    : `${type}: ${body.featureId ?? body.id ?? body.message}`;

window.reports = [];

let refused = false;

// Include all report types and earlier buffered reports.
new ReportingObserver(
  (reports) => {
    for (const report of reports) {
      window.reports.push(report.toJSON());
      const item = document.createElement('li');
      item.textContent = describe(report);
      list.append(item);
      if (
        report.type === 'csp-violation' &&
        report.body.effectiveDirective === 'worker-src'
      ) {
        refused = true;
        const { effectiveDirective, blockedURL } = report.body;
        say(
          '#worker-status',
          `The browser refused the worker: ${effectiveDirective} blocked ${blockedURL}`,
          true,
        );
      }
    }
    document.querySelector('#reports-empty').hidden = window.reports.length > 0;
  },
  { buffered: true },
).observe();

const source = 'onmessage = (event) => postMessage(`Hello, ${event.data}.`);';

// Worker errors are asynchronous; reports identify the policy.
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
    if (!refused) say('#worker-status', 'The worker failed.', true);
  };
  worker.postMessage('Playwright');
}

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
  // Calling geolocation triggers the violation report.
  navigator.geolocation.getCurrentPosition(
    () => {},
    () => {},
  );
}

startWorker();
askForLocation();
