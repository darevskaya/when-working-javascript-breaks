// The only file that starts a Worker. ESLint allows `new Worker` here and
// nowhere else, so every worker the demos start passes through this file.

// A Blob worker carries its code inside the page. The page CSP must allow
// blob: in worker-src.
export function workerFactory(source) {
  const blob = new Blob([source], { type: 'text/javascript' });
  const url = URL.createObjectURL(blob);
  try {
    return new Worker(url);
  } finally {
    // The Worker constructor reads the Blob URL, so the page can free it now.
    URL.revokeObjectURL(url);
  }
}

// A module worker loads a script file from the origin of the page.
// worker-src 'self' is enough.
export function moduleWorkerFactory(path) {
  return new Worker(new URL(path, import.meta.url), { type: 'module' });
}
