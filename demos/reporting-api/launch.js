import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { X509Certificate, createHash } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { createServer, createSecondServer } from './server.js';
import { createReportCollector, reportsFile } from './collector.js';

// Chromium reporting needs HTTPS, even on localhost.
export async function startReportingDemo({
  headless = false,
  port = 4185,
  secondPort = 4186,
  collector = createReportCollector(),
} = {}) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'reporting-demo-'));
  let browser;
  const servers = [];
  const close = async () => {
    await browser?.close();
    await Promise.all(
      servers.map((server) => new Promise((resolve) => server.close(resolve))),
    );
    await rm(directory, { recursive: true, force: true });
  };
  try {
    const openssl =
      process.env.OPENSSL ||
      (process.platform === 'win32'
        ? 'C:/Program Files/Git/usr/bin/openssl.exe'
        : 'openssl');
    await promisify(execFile)(
      openssl,
      [
        'req',
        '-x509',
        '-newkey',
        'rsa:2048',
        '-nodes',
        '-keyout',
        path.join(directory, 'key.pem'),
        '-out',
        path.join(directory, 'cert.pem'),
        '-days',
        '1',
        '-subj',
        '/CN=localhost',
        '-addext',
        'subjectAltName=DNS:localhost,IP:127.0.0.1',
      ],
      { windowsHide: true },
    );
    const tls = {
      key: await readFile(path.join(directory, 'key.pem')),
      cert: await readFile(path.join(directory, 'cert.pem')),
    };
    const listen = async (server, requestedPort) => {
      servers.push(server);
      await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(requestedPort, '127.0.0.1', resolve);
      });
      return server.address().port;
    };
    // Resolve the ephemeral port before configuring the app.
    const actualSecondPort = await listen(
      createSecondServer({ tls, collector }),
      secondPort,
    );
    const actualPort = await listen(
      createServer({
        tls,
        collector,
        secondOrigin: `https://127.0.0.1:${actualSecondPort}`,
      }),
      port,
    );
    const spki = new X509Certificate(tls.cert).publicKey.export({
      type: 'spki',
      format: 'der',
    });
    const fingerprint = createHash('sha256').update(spki).digest('base64');
    browser = await chromium.launchPersistentContext(
      path.join(directory, 'profile'),
      {
        headless,
        channel: 'chromium',
        ignoreDefaultArgs: ['--disable-background-networking'],
        args: [
          '--short-reporting-delay',
          `--ignore-certificate-errors-spki-list=${fingerprint}`,
        ],
      },
    );
    return { browser, origin: `https://127.0.0.1:${actualPort}`, close };
  } catch (error) {
    await close();
    throw error;
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const demo = await startReportingDemo();
  const page = await demo.browser.newPage();
  await page.goto(`${demo.origin}/demo/reporting-api`);
  console.log(`Reporting demo: ${demo.origin}/demo/reporting-api`);
  console.log(`Browser reports: ${reportsFile}`);
  console.log('Close the demo browser or press Ctrl+C to stop.');
  let closing = false;
  const stop = async () => {
    if (closing) return;
    closing = true;
    await demo.close();
  };
  demo.browser.on('close', stop);
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
}
