'use strict';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-for-tests-only';
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'test-password-1234';
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

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
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    req.end();
  });
}

test('GET /api/v1/prices/latest returns latest price payload with file fallback mode', async () => {
  const res = await get('/api/v1/prices/latest');
  assert.equal(res.status, 200);
  const parsed = JSON.parse(res.body);
  assert.equal(parsed.ok, true);
  assert.equal(typeof parsed.data.xauUsdPerOz, 'number');
  assert.equal(parsed.data.sourceMode, 'file');
});

test('GET /api/v1/prices/history returns range-aware response', async () => {
  const res = await get('/api/v1/prices/history?range=7d');
  assert.equal(res.status, 200);
  const parsed = JSON.parse(res.body);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.data.range, '7d');
  assert.equal(Array.isArray(parsed.data.points), true);
});

test('GET /api/v1/providers/status returns provider status envelope', async () => {
  const res = await get('/api/v1/providers/status');
  assert.equal(res.status, 200);
  const parsed = JSON.parse(res.body);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.data.sourceMode, 'file');
});

test('GET /api/v1/providers/runs returns fallback payload when DB is unavailable', async () => {
  const res = await get('/api/v1/providers/runs?limit=10');
  assert.equal(res.status, 200);
  const parsed = JSON.parse(res.body);
  assert.equal(parsed.ok, true);
  assert.equal(Array.isArray(parsed.data.runs), true);
  assert.equal(parsed.data.sourceMode, 'file');
});

test('GET /api/v1/prices/snapshots returns fallback snapshot from local JSON', async () => {
  const res = await get('/api/v1/prices/snapshots?limit=1');
  assert.equal(res.status, 200);
  const parsed = JSON.parse(res.body);
  assert.equal(parsed.ok, true);
  assert.equal(Array.isArray(parsed.data.snapshots), true);
  assert.equal(parsed.data.sourceMode, 'file');
});
