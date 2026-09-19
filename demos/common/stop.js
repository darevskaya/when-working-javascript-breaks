import { execFileSync } from 'node:child_process';

// Stops the demo server that npm start runs. It finds the processes that
// listen on the two demo ports and stops each one that runs server.js.
// Another program on those ports is left alone.
// Usage: npm run stop

const ports = [
  Number(process.env.PORT || 4173),
  Number(process.env.PROVIDER_PORT || 4174),
];
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
    // Lines like: TCP  127.0.0.1:4173  0.0.0.0:0  LISTENING  13812
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

const pids = new Set(ports.flatMap(listeners));
if (pids.size === 0) {
  console.log(`No server listens on port ${ports.join(' or ')}.`);
}
for (const pid of pids) {
  const command = commandLine(pid).trim();
  if (!command.includes('server.js')) {
    console.log(`Left process ${pid} alone. It runs: ${command || 'unknown'}`);
    continue;
  }
  process.kill(pid);
  console.log(`Stopped the demo server (process ${pid}).`);
}
