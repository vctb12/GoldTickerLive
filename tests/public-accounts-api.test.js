'use strict';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-for-tests-only';
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'test-password-1234';
process.env.PUBLIC_AUTH_TEST_MODE = '1';
process.env.NODE_ENV = 'test';

const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const os = require('node:os');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');

const storePath = path.join(os.tmpdir(), `public-accounts-${Date.now()}-${Math.random()}.json`);
process.env.PUBLIC_ACCOUNTS_DATA_FILE = storePath;
const app = require('../server.js');
const server = app.listen(0);
const port = server.address().port;

after(() => {
  server.close();
  if (fs.existsSync(storePath)) fs.unlinkSync(storePath);
});

function request({ method, path: urlPath, userId, userEmail, body }) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: '127.0.0.1',
        port,
        path: urlPath,
        method,
        headers: {
          ...(userId ? { 'x-test-user-id': userId } : {}),
          ...(userEmail ? { 'x-test-user-email': userEmail } : {}),
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (d) => (data += d));
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            json: data ? JSON.parse(data) : null,
          });
        });
      }
    );
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

test('public accounts auth guard blocks unauthorized requests', async () => {
  const response = await request({ method: 'GET', path: '/api/v1/me' });
  assert.equal(response.status, 401);
  assert.equal(response.json.ok, false);
});

test('saved calculations CRUD is user-scoped', async () => {
  const create = await request({
    method: 'POST',
    path: '/api/v1/me/saved-calculations',
    userId: 'user-1',
    userEmail: 'user1@example.com',
    body: {
      tool: 'value',
      label: '22k sample',
      input_data: { weight: 10, karat: '22' },
      output_data: { value: 'AED 2,000' },
    },
  });
  assert.equal(create.status, 201);
  const id = create.json?.data?.item?.id;
  assert.ok(id);

  const list = await request({
    method: 'GET',
    path: '/api/v1/me/saved-calculations',
    userId: 'user-1',
  });
  assert.equal(list.status, 200);
  assert.equal(list.json.data.items.length, 1);

  const otherUserDelete = await request({
    method: 'DELETE',
    path: `/api/v1/me/saved-calculations/${id}`,
    userId: 'user-2',
  });
  assert.equal(otherUserDelete.status, 404);

  const deleteOwn = await request({
    method: 'DELETE',
    path: `/api/v1/me/saved-calculations/${id}`,
    userId: 'user-1',
  });
  assert.equal(deleteOwn.status, 200);
});

test('watchlist CRUD works and unauthorized tokens are rejected', async () => {
  const badToken = await request({
    method: 'GET',
    path: '/api/v1/me/watchlist',
  });
  assert.equal(badToken.status, 401);

  const create = await request({
    method: 'POST',
    path: '/api/v1/me/watchlist',
    userId: 'user-1',
    body: {
      item_type: 'currency',
      item_key: 'AED',
      item_label: 'AED watch',
    },
  });
  assert.equal(create.status, 201);
  const id = create.json?.data?.item?.id;
  assert.ok(id);

  const list = await request({
    method: 'GET',
    path: '/api/v1/me/watchlist',
    userId: 'user-1',
  });
  assert.equal(list.status, 200);
  assert.equal(list.json.data.items.length, 1);

  const del = await request({
    method: 'DELETE',
    path: `/api/v1/me/watchlist/${id}`,
    userId: 'user-1',
  });
  assert.equal(del.status, 200);
});
