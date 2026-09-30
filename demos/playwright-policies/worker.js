const source = 'onmessage = (event) => postMessage(`Hello, ${event.data}.`);';

function startWorker() {
  const status = document.querySelector('#worker-status');
  const blob = new Blob([source], { type: 'text/javascript' });
  const url = URL.createObjectURL(blob);
  const worker = new Worker(url);
  URL.revokeObjectURL(url);
  worker.onmessage = ({ data }) => {
    status.textContent = `The worker replied: ${data}`;
    status.className = 'allowed';
    worker.terminate();
  };
  worker.onerror = () => {
    status.textContent = 'The browser refused the worker.';
    status.className = 'blocked';
  };
  worker.postMessage('Playwright');
}

startWorker();
