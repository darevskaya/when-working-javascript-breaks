import { test, expect } from '@playwright/test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { startReportingDemo } from '../launch.js';
import { createReportCollector } from '../collector.js';

test('Chromium delivers CSP, COOP, COEP and legacy CSP to the collector', async () => {
  test.setTimeout(60000);
  // Collect into this run's own file, so the poll below reads only these
  // reports and the demo log stays untouched.
  const directory = await mkdtemp(path.join(os.tmpdir(), 'browser-reports-'));
  const file = path.join(directory, 'reports.jsonl');
  const demo = await startReportingDemo({
    headless: true,
    port: 0,
    secondPort: 0,
    collector: createReportCollector({ file }),
  });
  try {
    for (const [policy, mode] of [
      ['csp', 'enforce'],
      ['coep', 'enforce'],
      ['coop', 'enforce'],
      ['csp', 'report-only'],
      ['coep', 'report-only'],
      ['coop', 'report-only'],
      ['csp', 'legacy'],
    ]) {
      const page = await demo.browser.newPage();
      await page.goto(`${demo.origin}/demo/reporting-api/${policy}/${mode}`);
      await page.getByRole('button', { name: 'Trigger violation' }).click();
    }
    await expect
      .poll(
        async () => {
          const content = await readFile(file, 'utf8').catch(() => '');
          const seen = content
            .trim()
            .split('\n')
            .filter(Boolean)
            .map(JSON.parse)
            .map(
              (entry) =>
                `${entry.format}:${entry.report.type}:${entry.report.body.disposition}`,
            );
          return [...new Set(seen)].sort();
        },
        { timeout: 45000 },
      )
      .toEqual([
        'legacy-csp:csp-violation:enforce',
        'reporting-api:coep:enforce',
        'reporting-api:coep:reporting',
        'reporting-api:coop:enforce',
        'reporting-api:coop:reporting',
        'reporting-api:csp-violation:enforce',
        'reporting-api:csp-violation:report',
      ]);
  } finally {
    await demo.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test('reporting examples enforce or report each policy', async ({
  page,
  context,
}) => {
  await page.goto('/demo/reporting-api');
  await page.screenshot({
    path: 'test-results/reporting-desktop.png',
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: 'test-results/reporting-mobile.png',
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.setViewportSize({ width: 1280, height: 720 });
  for (const mode of ['enforce', 'report-only', 'legacy']) {
    await page.goto(`/demo/reporting-api/csp/${mode}`);
    await page.getByRole('button', { name: 'Trigger violation' }).click();
    await expect(page.getByRole('status')).toContainText(
      mode === 'report-only' ? 'Inline script ran' : 'Inline script blocked',
    );
  }
  for (const mode of ['enforce', 'report-only']) {
    await page.goto(`/demo/reporting-api/coep/${mode}`);
    await page.getByRole('button', { name: 'Trigger violation' }).click();
    await expect(page.getByRole('status')).toContainText(
      mode === 'report-only' ? 'script loaded' : 'script blocked',
    );
    await page.goto(`/demo/reporting-api/coop/${mode}`);
    const popupPromise = context.waitForEvent('page');
    await page.getByRole('button', { name: 'Trigger violation' }).click();
    const popup = await popupPromise;
    await expect(page.getByRole('status')).toContainText(
      `popup.closed: ${mode === 'enforce'}`,
    );
    await popup.close();
  }
});
