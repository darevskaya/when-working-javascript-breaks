import { execFileSync } from 'node:child_process';
import { allPorts } from './demos.js';

const ports = allPorts;
const servers = ['server.js', 'hub.js', 'start-all.js', 'launch.js'];

const windows = process.platform === 'win32';

const run = (command, args) => {
  try {
    return execFileSync(command, args, { encoding: 'utf8', stdio: 'pipe' });
  } catch (error) {
    return error.stdout ?? '';
  }
};

function listeners(port) {
  if (windows) {
    // Columns: protocol, local, remote, state, PID.
    return run('netstat', ['-ano', '-p', 'tcp'])
      .split('\n')
      .map((line) => line.trim().split(/\s+/))
      .filter(
        ([, local, , state]) =>
          state === 'LISTENING' && local?.endsWith(`:${port}`),
      )
      .map((columns) => Number(columns[4]));
  }
  return run('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-t'])
    .split('\n')
    .filter(Boolean)
    .map(Number);
}

function commandLine(pid) {
  return windows
    ? run('powershell', [
        '-NoProfile',
        '-Command',
        `(Get-CimInstance Win32_Process -Filter 'ProcessId=${pid}').CommandLine`,
      ])
    : run('ps', ['-o', 'command=', '-p', String(pid)]);
}

// Listeners may exit before we reach them.
function alive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

let stopped = 0;
for (const pid of new Set(ports.flatMap(listeners))) {
  if (!alive(pid)) continue;
  const command = commandLine(pid).trim();
  if (!servers.some((name) => command.includes(name))) {
    console.log(`Left process ${pid} alone. It runs: ${command || 'unknown'}`);
    continue;
  }
  process.kill(pid);
  stopped += 1;
  console.log(`Stopped a demo server (process ${pid}).`);
}
if (stopped === 0) console.log('No demo server is running.');
