'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const http = require('node:http');
const { normalizeQuote } = require('../server/services/realtime-price-service');
const { createPriceStreamRouter } = require('../server/routes/price-stream');

test('normalizeQuote rejects invalid prices and timestamps', () => {
  assert.equal(normalizeQuote('test', 0, '2026-08-07T12:00:00Z', '2026-08-07T12:00:01Z'), null);
  assert.equal(normalizeQuote('test', 4000, 'not-a-date', '2026-08-07T12:00:01Z'), null);
});

test('normalizeQuote marks recent provider data fresh', () => {
  const quote = normalizeQuote('test', 4000, new Date().toISOString(), new Date().toISOString());
  assert.equal(quote.isFresh, true);
  assert.equal(quote.isFallback, false);
  assert.equal(quote.provider, 'test');
});

test('live REST route returns the current runtime snapshot', async () => {
  const quote = {
    xauUsdPerOz: 4000,
    timestampUtc: new Date().toISOString(),
    fetchedAtUtc: new Date().toISOString(),
    provider: 'test',
    isFresh: true,
    isFallback: false,
  };
  const service = {
    start() {},
    getSnapshot: () => quote,
    subscribe() {
      return () => {};
    },
    getProviderFailures: () => ({}),
  };
  const app = express();
  app.use('/api/v1', createPriceStreamRouter({ service }));
  const server = app.listen(0);

  try {
    const port = server.address().port;
    const response = await new Promise((resolve, reject) => {
      http
        .get({ host: '127.0.0.1', port, path: '/api/v1/prices/live' }, (res) => {
          let body = '';
          res.setEncoding('utf8');
          res.on('data', (chunk) => (body += chunk));
          res.on('end', () => resolve({ status: res.statusCode, body }));
        })
        .on('error', reject);
    });
    const parsed = JSON.parse(response.body);
    assert.equal(response.status, 200);
    assert.equal(parsed.ok, true);
    assert.equal(parsed.data.provider, 'test');
    assert.equal(parsed.meta.freshness, 'live');
  } finally {
    server.close();
  }
});

test('price stream sends named price events and heartbeats', async () => {
  let listener = null;
  const quote = {
    xauUsdPerOz: 4000,
    timestampUtc: new Date().toISOString(),
    fetchedAtUtc: new Date().toISOString(),
    provider: 'test',
    isFresh: true,
    isFallback: false,
  };
  const service = {
    start() {},
    getSnapshot: () => quote,
    subscribe(fn) {
      listener = fn;
      return () => {
        listener = null;
      };
    },
    getProviderFailures: () => ({}),
  };
  const app = express();
  app.use('/api/v1', createPriceStreamRouter({ service }));
  const server = app.listen(0);

  try {
    const port = server.address().port;
    const response = await new Promise((resolve, reject) => {
      const request = http.get(
        { host: '127.0.0.1', port, path: '/api/v1/prices/stream' },
        (res) => {
          let body = '';
          res.setEncoding('utf8');
          res.on('data', (chunk) => {
            body += chunk;
            if (body.includes('event: price')) {
              resolve({ res, body });
              request.destroy();
            }
          });
        }
      );
      request.on('error', (error) => {
        if (error.code !== 'ECONNRESET') reject(error);
      });
    });
    assert.match(response.body, /event: price/);
    assert.match(response.body, /"xauUsdPerOz":4000/);
    listener?.(quote);
  } finally {
    server.close();
  }
});
