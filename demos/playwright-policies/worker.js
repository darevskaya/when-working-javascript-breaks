const say = (id, text, blocked) => {
  const element = document.querySelector(id);
  element.textContent = text;
  element.className = blocked ? 'blocked' : 'allowed';
};

const source = 'onmessage = (event) => postMessage(`Hello, ${event.data}.`);';

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
    say('#worker-status', 'The browser refused the worker.', true);
  };
  worker.postMessage('Playwright');
}

startWorker();
