export function createWorker() {
  return new Worker(new URL('./tasks.worker.js', import.meta.url), {
    type: 'module',
  });
}
