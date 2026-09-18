import { appendFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

export const reportsFile = path.join(
  import.meta.dirname,
  'logs/browser-reports.jsonl',
);

// Browsers put page and blocked URLs in a report. Control characters in those
// URLs would reach the terminal, so replace them before printing.
const readable = (line) => line.replace(/\p{Cc}/gu, ' ');

// Receives POST /reports. A modern browser sends an array of reports.
// The legacy report-uri route sends one { "csp-report": {...} } object.
export function createReportCollector({
  file = reportsFile,
  log = console.log,
} = {}) {
  return async (request, response) => {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    let format = 'reporting-api';
    let reports;
    try {
      const payload = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      const legacy = payload['csp-report'];
      if (legacy) {
        format = 'legacy-csp';
        reports = [
          { type: 'csp-violation', url: legacy['document-uri'], body: legacy },
        ];
      } else {
        reports = [...payload];
      }
    } catch {
      response.writeHead(400);
      response.end('Send a report as JSON');
      return;
    }

    await mkdir(path.dirname(file), { recursive: true });
    for (const report of reports) {
      const entry = { receivedAt: new Date().toISOString(), format, report };
      await appendFile(file, JSON.stringify(entry) + '\n');
      log(
        readable(
          `\n${entry.receivedAt}  ${report.type} [${format}]` +
            `\n  Page: ${report.url}` +
            `\n  ${JSON.stringify(report.body)}`,
        ),
      );
    }
    response.writeHead(204);
    response.end();
  };
}
