import { serve, listener, common, isMain, ports } from '../common/serve.js';
import { createReportCollector } from './collector.js';

// Reporting-Endpoints gives the receiver a name. The policy then sends its
// reports to that name with report-to. The browser delivers reports only over
// HTTPS, so npm start runs launch.js, which serves these pages over HTTPS.
export function createServer({
  secondOrigin = `http://127.0.0.1:${ports.provider}`,
  collector = createReportCollector(),
  tls,
} = {}) {
  const endpoints = { 'Reporting-Endpoints': 'demo="/reports"' };
  const example = (headers) => ({ file: 'example.html', ...headers });
  return listener(
    tls,
    serve(
      {
        '/': 'index.html',
        '/demo/reporting': 'index.html',
        '/demo/reporting/csp/enforce': example({
          ...endpoints,
          'Content-Security-Policy': "script-src 'self'; report-to demo",
        }),
        '/demo/reporting/csp/report-only': example({
          ...endpoints,
          'Content-Security-Policy-Report-Only':
            "script-src 'self'; report-to demo",
        }),
        // The legacy route names no receiver. report-uri holds the URL.
        '/demo/reporting/csp/legacy': example({
          'Content-Security-Policy': "script-src 'self'; report-uri /reports",
        }),
        '/demo/reporting/coop/enforce': example({
          ...endpoints,
          'Cross-Origin-Opener-Policy': 'same-origin; report-to="demo"',
        }),
        '/demo/reporting/coop/report-only': example({
          ...endpoints,
          'Cross-Origin-Opener-Policy-Report-Only':
            'same-origin; report-to="demo"',
        }),
        '/demo/reporting/coep/enforce': example({
          ...endpoints,
          'Cross-Origin-Embedder-Policy': 'require-corp; report-to="demo"',
        }),
        '/demo/reporting/coep/report-only': example({
          ...endpoints,
          'Cross-Origin-Embedder-Policy-Report-Only':
            'require-corp; report-to="demo"',
        }),
        '/reporting.js': 'reporting.js',
        '/reporting-config.js': {
          body: `export const secondOrigin = '${secondOrigin}';\n`,
        },
        '/styles.css': common('styles.css'),
        // The receiver that the rows above name. It writes its own response.
        '/reports': collector,
      },
      { root: import.meta.dirname },
    ),
  );
}

// The second origin that the COOP and COEP examples reach for.
export function createSecondServer({
  collector = createReportCollector(),
  tls,
} = {}) {
  return listener(
    tls,
    serve(
      {
        '/reporting-popup': 'popup.html',
        '/reporting-resource.js': {
          body: '// A script served by the second origin.\n',
        },
        '/styles.css': common('styles.css'),
        '/reports': collector,
      },
      { root: import.meta.dirname },
    ),
  );
}

// Plain HTTP, for the Playwright tests. The pages work, but the browser
// delivers no reports.
if (isMain(import.meta)) {
  const collector = createReportCollector();
  createServer({ collector }).listen(ports.app, '127.0.0.1', () =>
    console.log(`Reporting over HTTP: http://127.0.0.1:${ports.app}`),
  );
  createSecondServer({ collector }).listen(ports.provider, '127.0.0.1');
}
