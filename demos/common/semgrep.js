import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

// Runs Semgrep with the given arguments. pip install --user puts semgrep in a
// Scripts or bin folder that is often not on PATH, and semgrep then cannot
// start its own pysemgrep helper. So look there too, and put that folder on
// PATH for the child process.
// Usage: node ../common/semgrep.js scan --config .semgrep.yml .

const executable = process.platform === 'win32' ? 'semgrep.exe' : 'semgrep';

function onPath(env) {
  return (
    spawnSync('semgrep', ['--version'], { env, stdio: 'ignore' }).status === 0
  );
}

// The user Scripts folder of each Python on PATH that has semgrep in it.
function userScripts() {
  for (const python of ['python', 'python3', 'py']) {
    const result = spawnSync(
      python,
      [
        '-c',
        "import os, sysconfig; print(sysconfig.get_path('scripts', f'{os.name}_user'))",
      ],
      { encoding: 'utf8' },
    );
    const folder = result.stdout?.trim();
    if (result.status === 0 && existsSync(path.join(folder, executable))) {
      return folder;
    }
  }
  return null;
}

export function semgrepEnv() {
  if (onPath(process.env)) return process.env;
  const folder = userScripts();
  if (!folder) return null;
  // Windows often spells the variable Path. Keep one key.
  const key =
    Object.keys(process.env).find((name) => name.toUpperCase() === 'PATH') ??
    'PATH';
  return {
    ...process.env,
    [key]: `${folder}${path.delimiter}${process.env[key] ?? ''}`,
  };
}

// The findings of one Semgrep configuration, as "file:line rule" strings,
// sorted. Returns null when Semgrep is not installed.
export function findings(config, target) {
  const env = semgrepEnv();
  if (!env) return null;
  const result = spawnSync(
    'semgrep',
    ['scan', '--config', config, '--metrics', 'off', '--json', target],
    { encoding: 'utf8', env, stdio: ['ignore', 'pipe', 'ignore'] },
  );
  return JSON.parse(result.stdout)
    .results.map(
      (found) =>
        `${path.basename(found.path)}:${found.start.line} ${found.check_id.split('.').pop()}`,
    )
    .sort();
}

if (import.meta.filename === path.resolve(process.argv[1] ?? '')) {
  const env = semgrepEnv();
  if (!env) {
    console.error('Semgrep is not installed. Run: pip install semgrep');
    process.exit(2);
  }
  const result = spawnSync('semgrep', process.argv.slice(2), {
    env,
    stdio: 'inherit',
  });
  process.exit(result.status ?? 1);
}
