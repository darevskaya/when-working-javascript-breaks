import { createWorker } from './worker-factory.js';

async function show(id, message, format) {
  const output = document.querySelector(id);
  try {
    const worker = createWorker();
    worker.onmessage = ({ data }) => {
      worker.terminate();
      output.textContent = format(data);
    };
    worker.onerror = () => {
      worker.terminate();
      output.textContent = 'Worker failed';
      output.className = 'blocked';
    };
    worker.postMessage(message);
  } catch (error) {
    output.textContent = `Worker failed (${error.name})`;
    output.className = 'blocked';
  }
}

show('#total', { kind: 'total', amounts: [19.99, 4.5, 18.01] }, (total) =>
  `Total: ${total}`,
);
show('#status', { kind: 'status' }, (status) => status);
