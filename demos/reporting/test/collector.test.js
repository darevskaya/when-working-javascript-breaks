import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createServer, createProviderServer } from '../server.js';
import { createReportCollector } from '../reporting.js';

// A terminal escape, of the kind a browser can put in a blocked URL.
const terminalEscape = String.fromCharCode(27);

test('both servers collect modern batches and legacy CSP reports', async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'browser-reports-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const file = path.join(directory, 'reports.jsonl');
  const output = [];
  const collector = createReportCollector({
    file,
    log: (line) => output.push(line),
  });
  const servers = [
    createServer({ collector }),
    createProviderServer({ collector }),
  ];
  const origins = [];
  for (const server of servers) {
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    t.after(() => new Promise((resolve) => server.close(resolve)));
    origins.push(`http://127.0.0.1:${server.address().port}`);
  }
  const send = (origin, type, body) =>
    fetch(`${origin}/reports`, {
      method: 'POST',
      headers: { 'Content-Type': type },
      body,
    });

  // A modern browser sends an array of reports.
  const modern = ['csp-violation', 'coop', 'coep'].map((type) => ({
    type,
    age: 10,
    url: 'https://example.test/page',
    body: { disposition: 'enforce', type: 'corp' },
  }));
  // The legacy report-uri route sends one object.
  const legacy = {
    'csp-report': {
      'document-uri': 'https://example.test/legacy',
      'effective-directive': 'script-src',
      'blocked-uri': `inline${terminalEscape}[31m`,
      disposition: 'enforce',
    },
  };
  assert.equal(
    (
      await send(
        origins[0],
        'application/reports+json; charset=utf-8',
        JSON.stringify(modern),
      )
    ).status,
    204,
  );
  assert.equal(
    (await send(origins[1], 'application/csp-report', JSON.stringify(legacy)))
      .status,
    204,
  );

  const saved = (await readFile(file, 'utf8'))
    .trim()
    .split('\n')
    .map(JSON.parse);
  assert.equal(saved.length, 4);
  assert.equal(saved[0].format, 'reporting-api');
  assert.deepEqual(saved[0].report, modern[0]);
  assert.equal(saved[3].format, 'legacy-csp');
  assert.deepEqual(saved[3].report.body, legacy['csp-report']);
  assert.match(output[3], /script-src/);
  // The saved report keeps every field. The printed line stays readable.
  assert.ok(!output.join('').includes(terminalEscape));

  // A body that is not a report is answered, not crashed on.
  assert.equal(
    (await send(origins[0], 'application/reports+json', '{')).status,
    400,
  );
  assert.equal((await fetch(`${origins[0]}/reports`)).status, 400);
});
