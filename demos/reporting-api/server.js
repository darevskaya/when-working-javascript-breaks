import { serve, listener, isMain, demoPorts } from '../common/serve.js';

const ports = demoPorts(import.meta);
import { createReportCollector } from './collector.js';

export function createServer({
  secondOrigin = `http://127.0.0.1:${ports.provider}`,
  collector = createReportCollector(),
  tls,
} = {}) {
  const endpoints = { 'Reporting-Endpoints': 'demo="/reports"' };
  const example = (headers) => ({ file: 'violation.html', ...headers });
  return listener(
    tls,
    serve(
      {
        '/': 'index.html',
        '/demo/reporting-api': 'index.html',
        '/demo/reporting-api/csp/enforce': example({
          ...endpoints,
          'Content-Security-Policy': "script-src 'self'; report-to demo",
        }),
        '/demo/reporting-api/csp/report-only': example({
          ...endpoints,
          'Content-Security-Policy-Report-Only':
            "script-src 'self'; report-to demo",
        }),
        '/demo/reporting-api/csp/legacy': example({
          'Content-Security-Policy': "script-src 'self'; report-uri /reports",
        }),
        '/demo/reporting-api/coop/enforce': example({
          ...endpoints,
          'Cross-Origin-Opener-Policy': 'same-origin; report-to="demo"',
        }),
        '/demo/reporting-api/coop/report-only': example({
          ...endpoints,
          'Cross-Origin-Opener-Policy-Report-Only':
            'same-origin; report-to="demo"',
        }),
        '/demo/reporting-api/coep/enforce': example({
          ...endpoints,
          'Cross-Origin-Embedder-Policy': 'require-corp; report-to="demo"',
        }),
        '/demo/reporting-api/coep/report-only': example({
          ...endpoints,
          'Cross-Origin-Embedder-Policy-Report-Only':
            'require-corp; report-to="demo"',
        }),
        '/trigger-violation.js': 'trigger-violation.js',
        '/reporting-config.js': {
          body: `export const secondOrigin = '${secondOrigin}';\n`,
        },
        '/styles.css': 'styles.css',
        '/reports': collector,
      },
      { root: import.meta.dirname },
    ),
  );
}

export function createSecondServer({
  collector = createReportCollector(),
  tls,
} = {}) {
  return listener(
    tls,
    serve(
      {
        '/reporting-popup': 'second-origin-popup.html',
        '/reporting-resource.js': {
          body: '// A script served by the second origin.\n',
        },
        '/styles.css': 'styles.css',
        '/reports': collector,
      },
      { root: import.meta.dirname },
    ),
  );
}

// HTTP tests cannot verify report delivery.
if (isMain(import.meta)) {
  const collector = createReportCollector();
  createServer({ collector }).listen(ports.app, '127.0.0.1', () =>
    console.log(`reporting-api over HTTP: http://127.0.0.1:${ports.app}`),
  );
  createSecondServer({ collector }).listen(ports.provider, '127.0.0.1');
}
