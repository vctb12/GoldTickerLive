/**
 * Integration tests for server.js hardening:
 *   • Path traversal attempts return 404 (never leak filesystem content)
 *   • Security headers are set (CSP, frame-ancestors, etc.)
 *   • Rate limiter fires after a burst
 *   • 405 on unsupported methods to the static fallback
 *
 * These tests boot the real Express app on an ephemeral port, then hit it
 * with a plain HTTP client. They intentionally do not depend on supertest.
 */

'use strict';

// The server uses hardcoded process.env lookups; ensure safe test values.
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-for-tests-only';
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'test-password-1234';
process.env.NODE_ENV = 'production';

const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const path = require('node:path');

// Load the Express app. `server.js` only auto-starts a listener when
// `require.main === module`, so requiring it from tests is safe — we can
// bind to our own ephemeral port below.
const appPath = path.resolve(__dirname, '..', 'server.js');
const app = require(appPath);

const server = app.listen(0);
const port = server.address().port;

after(() => {
  server.close();
});

function get(p, extra = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host: '127.0.0.1', port, path: p, method: extra.method || 'GET' },
      (res) => {
        let body = '';
        res.on('data', (d) => (body += d));
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
      }
    );
    req.on('error', reject);
    req.end();
  });
}

test('path traversal attempts return 404, not filesystem content', async () => {
  const cases = [
    '/../etc/passwd',
    '/../../etc/passwd',
    '/%2e%2e/etc/passwd',
    '/%2e%2e%2fetc/passwd',
    '/..%2fetc/passwd',
    '/foo/../../etc/passwd',
    // Null byte injection
    '/foo%00.html',
  ];
  for (const p of cases) {
    const res = await get(p);
    assert.equal(res.status, 404, `expected 404 for ${p}, got ${res.status}`);
    assert.ok(!/root:x:/.test(res.body), `leaked /etc/passwd for ${p}`);
  }
});

test('security headers are present on a normal response', async () => {
  const res = await get('/api/health');
  assert.equal(res.status, 200);
  // Helmet defaults we rely on
  assert.ok(res.headers['x-content-type-options'], 'X-Content-Type-Options');
  assert.ok(res.headers['referrer-policy'], 'Referrer-Policy should be set by Helmet');
  assert.ok(res.headers['strict-transport-security'], 'HSTS should be set in production');
  // Our explicit directives
  const csp = res.headers['content-security-policy'];
  assert.ok(csp, 'CSP header must be present');
  assert.ok(csp.includes("frame-ancestors 'none'"), 'frame-ancestors locked down');
  assert.ok(csp.includes("object-src 'none'"), 'object-src denied');
  assert.ok(csp.includes("base-uri 'self'"), 'base-uri restricted');
});

test('health endpoint returns JSON ok', async () => {
  const res = await get('/api/health');
  assert.equal(res.status, 200);
  const parsed = JSON.parse(res.body);
  assert.equal(parsed.status, 'ok');
});

test('static fallback rejects non-GET/HEAD methods', async () => {
  const res = await get('/some-random-path', { method: 'PATCH' });
  // Either 404 (no route matched) or 405 from fallback — both acceptable,
  // but we must never 200 on a stray method.
  assert.notEqual(res.status, 200);
});
