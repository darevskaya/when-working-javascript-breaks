import { test } from 'node:test';
import { createServer, createSecondServer } from '../server.js';
import { listen, assertHeaders } from '../../common/test-helpers.js';

test('each example names the receiver and points one policy at it', async (t) => {
  const origin = await listen(createServer(), t);
  const second = await listen(createSecondServer(), t);
  const endpoints = { 'reporting-endpoints': 'demo="/reports"' };
  await assertHeaders(origin, {
    '/': {},
    '/demo/reporting-api/csp/enforce': {
      ...endpoints,
      'content-security-policy': "script-src 'self'; report-to demo",
    },
    '/demo/reporting-api/csp/report-only': {
      ...endpoints,
      'content-security-policy-report-only':
        "script-src 'self'; report-to demo",
    },
    '/demo/reporting-api/csp/legacy': {
      'content-security-policy': "script-src 'self'; report-uri /reports",
    },
    '/demo/reporting-api/coop/enforce': {
      ...endpoints,
      'cross-origin-opener-policy': 'same-origin; report-to="demo"',
    },
    '/demo/reporting-api/coop/report-only': {
      ...endpoints,
      'cross-origin-opener-policy-report-only': 'same-origin; report-to="demo"',
    },
    '/demo/reporting-api/coep/enforce': {
      ...endpoints,
      'cross-origin-embedder-policy': 'require-corp; report-to="demo"',
    },
    '/demo/reporting-api/coep/report-only': {
      ...endpoints,
      'cross-origin-embedder-policy-report-only':
        'require-corp; report-to="demo"',
    },
    '/trigger-violation.js': {},
  });
  await assertHeaders(second, {
    '/reporting-popup': {},
    '/reporting-resource.js': {},
  });
});
