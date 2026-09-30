import { spawn } from 'node:child_process';
import path from 'node:path';
import { demos, hub } from './demos.js';
import { createHub } from './hub.js';

const folder = path.resolve(import.meta.dirname, '..');

function startDemo(entry) {
  const child = spawn('node', ['server.js'], {
    cwd: path.join(folder, entry.id),
    stdio: 'inherit',
  });
  child.on('error', (error) =>
    console.error(`${entry.id} did not start: ${error.message}`),
  );
  child.on('exit', (code) => {
    if (code) console.error(`${entry.id} stopped with code ${code}.`);
  });
  return child;
}

const children = demos.map(startDemo);
const hubServer = createHub().listen(hub.port, '127.0.0.1', () => {
  console.log('');
  for (const entry of demos) {
    console.log(`http://127.0.0.1:${entry.port}  ${entry.id}`);
  }
  console.log(`\nAll demos: http://127.0.0.1:${hub.port}`);
});

let stopping = false;
function stop() {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill();
  hubServer.close();
}

process.once('SIGINT', stop);
process.once('SIGTERM', stop);
