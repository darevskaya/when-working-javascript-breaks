import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { semgrepEnv } from '../semgrep.js';

// Semgrep is a Python tool, not an npm package. Without it, skip.
const env = semgrepEnv();
function semgrep(target) {
  const output = execFileSync(
    'semgrep',
    ['scan', '--config', '.semgrep.yml', '--metrics', 'off', '--json', target],
    { encoding: 'utf8', env, stdio: ['ignore', 'pipe', 'ignore'] },
  );
  return JSON.parse(output).results.map(
    (result) =>
      `${path.basename(result.path)}:${result.start.line} ${result.check_id.split('.').pop()}`,
  );
}
const skip = env ? false : 'Semgrep is not installed';

test('the project rules find each line that a policy blocks', { skip }, () => {
  assert.deepEqual(semgrep('demos').sort(), [
    'calculate.js:9 script-src-string-to-code',
    'frame.js:20 sandbox-top-navigation',
    'provider.js:11 coop-window-opener',
    'provider.js:13 coop-window-opener',
    'provider.js:18 coop-window-opener',
    'provider.js:24 coop-window-opener',
    'provider.js:44 coop-window-opener',
    'sdk.js:21 trusted-types-markup-sink',
    'sdk.js:8 trusted-types-markup-sink',
    'worker-factory.js:10 worker-src-blob-worker',
  ]);
});

// ESLint flags every Worker path that is not a literal. The Semgrep taint
// rule follows the value, so it flags only a Blob URL.
test('the Blob worker rule follows the URL through variables', { skip }, () => {
  const folder = mkdtempSync(path.join(tmpdir(), 'semgrep-'));
  const file = path.join(folder, 'workers.js');
  writeFileSync(
    file,
    [
      'const url = URL.createObjectURL(blob);',
      'const workerUrl = url;',
      'new Worker(workerUrl);',
      'new Worker(config.path);',
      '',
    ].join('\n'),
  );
  assert.deepEqual(semgrep(file), ['workers.js:3 worker-src-blob-worker']);
});
