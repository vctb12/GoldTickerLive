'use strict';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-shops-business';
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'test-password-shops-business';
process.env.ADMIN_ACCESS_PIN = process.env.ADMIN_ACCESS_PIN || '123456';
process.env.NODE_ENV = 'test';

const { test, describe, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');

const ROOT = path.resolve(__dirname, '..');
const LEADS_FILE = path.join(ROOT, 'data', 'shop_leads.json');
const CLAIMS_FILE = path.join(ROOT, 'data', 'shop_claims.json');
const CLICKS_FILE = path.join(ROOT, 'data', 'shop_click_events.json');
const SPONSORED_FILE = path.join(ROOT, 'data', 'sponsored_placements.json');

const backups = new Map();
for (const filePath of [LEADS_FILE, CLAIMS_FILE, CLICKS_FILE, SPONSORED_FILE]) {
  backups.set(filePath, fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : null);
}

const app = require(path.join(ROOT, 'server.js'));
const server = app.listen(0);
const port = server.address().port;

function resetJsonFile(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, '[]');
}

before(() => {
  resetJsonFile(LEADS_FILE);
  resetJsonFile(CLAIMS_FILE);
  resetJsonFile(CLICKS_FILE);
  resetJsonFile(SPONSORED_FILE);
});

beforeEach(() => {
  resetJsonFile(LEADS_FILE);
  resetJsonFile(CLAIMS_FILE);
  resetJsonFile(CLICKS_FILE);
  resetJsonFile(SPONSORED_FILE);
});

after(() => {
  server.close();
  for (const [filePath, original] of backups.entries()) {
    if (original === null) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } else {
      fs.writeFileSync(filePath, original);
    }
  }
});

function request(method, routePath, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        host: '127.0.0.1',
        port,
        path: routePath,
        method,
        headers: {
          ...(payload
            ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
            : {}),
          ...headers,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let json = null;
          try {
            json = JSON.parse(data);
          } catch {}
          resolve({ status: res.statusCode, body: json, raw: data, headers: res.headers });
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function getAdminToken() {
  const login = await request('POST', '/api/admin/auth/login', {
    email: 'admin@goldprices.com',
    password: process.env.ADMIN_PASSWORD,
  });
  return login.body?.token;
}

describe('shops business API', () => {
  test('GET /api/v1/shops returns listing type buckets', async () => {
    const res = await request('GET', '/api/v1/shops');
    assert.equal(res.status, 200);
    assert.equal(res.body?.success, true);
    assert.ok(typeof res.body?.data?.listing_types?.market_cluster === 'number');
    assert.ok(Array.isArray(res.body?.data?.shop_listings));
    assert.ok(Array.isArray(res.body?.data?.market_clusters));
  });

  test('POST /api/v1/shops/:id/lead stores a lead', async () => {
    const res = await request('POST', '/api/v1/shops/test-shop-1/lead', {
      lead_type: 'call',
      name: 'A User',
      email: 'user@example.com',
      message: 'Please contact me',
    });
    assert.equal(res.status, 201);
    assert.equal(res.body?.success, true);

    const leads = JSON.parse(fs.readFileSync(LEADS_FILE, 'utf8'));
    assert.equal(leads.length, 1);
    assert.equal(leads[0].lead_type, 'call');
    assert.equal(leads[0].shop_id, 'test-shop-1');
  });

  test('POST /api/v1/shops/:id/claim stores claim in pending status', async () => {
    const res = await request('POST', '/api/v1/shops/test-shop-1/claim', {
      claimant_name: 'Shop Owner',
      claimant_email: 'owner@example.com',
      note: 'I own this listing',
    });
    assert.equal(res.status, 201);
    assert.equal(res.body?.status, 'pending');

    const claims = JSON.parse(fs.readFileSync(CLAIMS_FILE, 'utf8'));
    assert.equal(claims.length, 1);
    assert.equal(claims[0].status, 'pending');
    assert.equal(claims[0].shop_id, 'test-shop-1');
  });

  test('POST /api/v1/shops/:id/click validates action and records event', async () => {
    const bad = await request('POST', '/api/v1/shops/test-shop-1/click', { action: 'bad' });
    assert.equal(bad.status, 400);

    const ok = await request('POST', '/api/v1/shops/test-shop-1/click', { action: 'website' });
    assert.equal(ok.status, 201);

    const clicks = JSON.parse(fs.readFileSync(CLICKS_FILE, 'utf8'));
    assert.equal(clicks.length, 1);
    assert.equal(clicks[0].action, 'website');
  });

  test('admin endpoints are protected', async () => {
    const unauth = await request('GET', '/api/v1/admin/shops/leads');
    assert.equal(unauth.status, 401);

    const token = await getAdminToken();
    const authd = await request('GET', '/api/v1/admin/shops/leads', null, {
      Authorization: `Bearer ${token}`,
    });
    assert.equal(authd.status, 200);
    assert.equal(authd.body?.success, true);
  });
});
