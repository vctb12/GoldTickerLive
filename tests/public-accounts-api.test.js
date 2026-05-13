'use strict';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-for-tests-only';
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'test-password-1234';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const os = require('node:os');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const express = require('express');
const { createPublicAccountsRouter } = require('../server/routes/public-accounts');

function withServer(handler) {
  return new Promise((resolve, reject) => {
    const app = express();
    app.use(express.json());
    const file = path.join(os.tmpdir(), `public-accounts-${Date.now()}-${Math.random()}.json`);
    const router = createPublicAccountsRouter({
      storePath: file,
      resolveUser: async (token) => {
        if (token === 'valid-token') {
          return { id: 'user-1', email: 'user1@example.com', user_metadata: {} };
        }
        if (token === 'other-token') {
          return { id: 'user-2', email: 'user2@example.com', user_metadata: {} };
        }
        return null;
      },
    });
    app.use('/api/v1', router);
    const server = app.listen(0, async () => {
      const port = server.address().port;
      try {
        await handler({ port, file });
        resolve();
      } catch (error) {
        reject(error);
      } finally {
        server.close(() => {
          if (fs.existsSync(file)) fs.unlinkSync(file);
        });
      }
    });
  });
}

function request({ port, method, path: urlPath, token, body }) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: '127.0.0.1',
        port,
        path: urlPath,
        method,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
  await withServer(async ({ port }) => {
    const response = await request({ port, method: 'GET', path: '/api/v1/me' });
    assert.equal(response.status, 401);
    assert.equal(response.json.ok, false);
  });
});

test('saved calculations CRUD is user-scoped', async () => {
  await withServer(async ({ port }) => {
    const create = await request({
      port,
      method: 'POST',
      path: '/api/v1/me/saved-calculations',
      token: 'valid-token',
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
      port,
      method: 'GET',
      path: '/api/v1/me/saved-calculations',
      token: 'valid-token',
    });
    assert.equal(list.status, 200);
    assert.equal(list.json.data.items.length, 1);

    const otherUserDelete = await request({
      port,
      method: 'DELETE',
      path: `/api/v1/me/saved-calculations/${id}`,
      token: 'other-token',
    });
    assert.equal(otherUserDelete.status, 404);

    const deleteOwn = await request({
      port,
      method: 'DELETE',
      path: `/api/v1/me/saved-calculations/${id}`,
      token: 'valid-token',
    });
    assert.equal(deleteOwn.status, 200);
  });
});

test('watchlist CRUD works and unauthorized tokens are rejected', async () => {
  await withServer(async ({ port }) => {
    const badToken = await request({
      port,
      method: 'GET',
      path: '/api/v1/me/watchlist',
      token: 'invalid-token',
    });
    assert.equal(badToken.status, 401);

    const create = await request({
      port,
      method: 'POST',
      path: '/api/v1/me/watchlist',
      token: 'valid-token',
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
      port,
      method: 'GET',
      path: '/api/v1/me/watchlist',
      token: 'valid-token',
    });
    assert.equal(list.status, 200);
    assert.equal(list.json.data.items.length, 1);

    const del = await request({
      port,
      method: 'DELETE',
      path: `/api/v1/me/watchlist/${id}`,
      token: 'valid-token',
    });
    assert.equal(del.status, 200);
  });
});
