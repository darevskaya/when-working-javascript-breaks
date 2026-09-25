import { config } from './config.js';

// The one call to new Worker in the demo. The lint rules keep it here.
export function createWorker() {
  return new Worker(config.workerScript, { type: 'module' });
}

function ask(message) {
  return new Promise((resolve, reject) => {
    const worker = createWorker();
    worker.onmessage = ({ data }) => {
      worker.terminate();
      resolve(data);
    };
    worker.onerror = () => {
      worker.terminate();
      reject(new Error('worker-src'));
    };
    worker.postMessage(message);
  });
}

export const total = (amounts) => ask({ kind: 'total', amounts });

export const status = () => ask({ kind: 'status' });
