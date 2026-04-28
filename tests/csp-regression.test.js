'use strict';

/**
 * CSP regression test.
 *
 * Boots the real Express app under NODE_ENV=production and asserts every
 * directive of the production CSP literally. This is a tripwire: silently
 * loosening the CSP (e.g. adding `'unsafe-inline'` to scriptSrc) will break
 * this test.
 *
 * See docs/plans/2026-04-24_security-performance-deps-audit.md Track A,
 * section "A.3 Authoritative sweeps".
 */

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-for-tests-only';
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'test-password-1234';
process.env.NODE_ENV = 'production';

const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const path = require('node:path');

const appPath = path.resolve(__dirname, '..', 'server.js');
const app = require(appPath);
const server = app.listen(0);
const port = server.address().port;

after(() => {
  server.close();
});

function get(p) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, path: p, method: 'GET' }, (res) => {
      let body = '';
      res.on('data', (d) => (body += d));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    req.end();
  });
}

// Directives we require to be present literally. We assert *substrings*, not
// full equality, because Helmet may reorder directives or emit them in either
// space-separated or semicolon-separated form depending on version.
const REQUIRED_CSP_DIRECTIVES = [
  "default-src 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  // script-src must *not* contain 'unsafe-inline' or 'unsafe-eval' in prod.
  "script-src 'self'",
  'upgrade-insecure-requests',
];

const FORBIDDEN_CSP_FRAGMENTS = [
  // If any of these ever reappear in scriptSrc, the tripwire fires.
  "script-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-eval'",
];

test('production CSP header contains every required directive', async () => {
  const res = await get('/api/health');
  assert.equal(res.status, 200);
  const csp = res.headers['content-security-policy'];
  assert.ok(csp, 'CSP header must be set in production');

  for (const frag of REQUIRED_CSP_DIRECTIVES) {
    assert.ok(
      csp.includes(frag),
      `CSP missing required directive fragment: "${frag}". Full header: ${csp}`
    );
  }
  for (const frag of FORBIDDEN_CSP_FRAGMENTS) {
    assert.ok(
      !csp.includes(frag),
      `CSP must not contain forbidden fragment: "${frag}". Full header: ${csp}`
    );
  }
});

test('production CSP forbids unsafe-inline / unsafe-eval in script-src', async () => {
  const res = await get('/api/health');
  const csp = res.headers['content-security-policy'] || '';
  // Grab the script-src directive regardless of directive order.
  const match = csp.match(/script-src([^;]*)/);
  assert.ok(match, 'script-src directive must exist');
  const scriptSrc = match[1];
  assert.ok(
    !scriptSrc.includes("'unsafe-inline'"),
    `script-src must not include 'unsafe-inline': ${scriptSrc}`
  );
  assert.ok(
    !scriptSrc.includes("'unsafe-eval'"),
    `script-src must not include 'unsafe-eval': ${scriptSrc}`
  );
});

test('production sets HSTS with preload + includeSubDomains', async () => {
  const res = await get('/api/health');
  const hsts = res.headers['strict-transport-security'] || '';
  assert.match(hsts, /max-age=\d+/);
  assert.match(hsts, /includeSubDomains/i);
  assert.match(hsts, /preload/i);
});

test('production sets frame-ancestors none and X-Content-Type-Options', async () => {
  const res = await get('/api/health');
  assert.ok(
    (res.headers['content-security-policy'] || '').includes("frame-ancestors 'none'"),
    'frame-ancestors must be locked to none'
  );
  assert.equal(res.headers['x-content-type-options'], 'nosniff');
});

// Track A #14 — Permissions-Policy parity with `_headers` / `.htaccess`.
test('production sets Permissions-Policy disabling sensitive features', async () => {
  const res = await get('/api/health');
  const pp = res.headers['permissions-policy'] || '';
  assert.ok(pp, 'Permissions-Policy header must be set');
  for (const feature of [
    'accelerometer=()',
    'camera=()',
    'geolocation=()',
    'gyroscope=()',
    'magnetometer=()',
    'microphone=()',
    'payment=()',
    'usb=()',
    'interest-cohort=()',
  ]) {
    assert.ok(pp.includes(feature), `Permissions-Policy missing "${feature}". Full header: ${pp}`);
  }
});
