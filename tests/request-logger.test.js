'use strict';

/**
 * request-logger.test.js — structured Morgan access-log formatter.
 *
 * Pins status→level mapping and user-agent truncation so production JSON logs
 * stay machine-parseable and cannot balloon from unbounded UA strings.
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');

const {
  formatRequestLogLine,
  MAX_USER_AGENT_LENGTH,
  createRequestLogger,
} = require('../server/lib/request-logger');

function stubTokens({ status = '200', method = 'GET', responseTime = '12.3', ua = 'jest', contentLength = '42' } = {}) {
  return {
    status: () => status,
    method: () => method,
    'response-time': () => responseTime,
    req: (_req, _res, name) => (name === 'user-agent' ? ua : ''),
    res: (_req, _res, name) => (name === 'content-length' ? contentLength : ''),
  };
}

test('request-logger: createRequestLogger returns a middleware function', () => {
  const mw = createRequestLogger();
  assert.equal(typeof mw, 'function');
});

test('request-logger: 2xx/3xx → info, 4xx → warn, 5xx → error', () => {
  const req = { path: '/api/v1/health', ip: '127.0.0.1' };
  const res = {};

  const ok = JSON.parse(formatRequestLogLine(stubTokens({ status: '200' }), req, res));
  assert.equal(ok.level, 'info');
  assert.equal(ok.status, 200);
  assert.equal(ok.method, 'GET');
  assert.equal(ok.path, '/api/v1/health');
  assert.equal(ok.responseTimeMs, 12.3);
  assert.equal(ok.contentLength, 42);
  assert.equal(ok.ip, '127.0.0.1');
  assert.match(ok.ts, /^\d{4}-\d{2}-\d{2}T/);

  const redirect = JSON.parse(formatRequestLogLine(stubTokens({ status: '302' }), req, res));
  assert.equal(redirect.level, 'info');

  const client = JSON.parse(formatRequestLogLine(stubTokens({ status: '404' }), req, res));
  assert.equal(client.level, 'warn');

  const server = JSON.parse(formatRequestLogLine(stubTokens({ status: '503' }), req, res));
  assert.equal(server.level, 'error');
});

test('request-logger: truncates user-agent to MAX_USER_AGENT_LENGTH', () => {
  const req = { path: '/', ip: null, socket: { remoteAddress: '::1' } };
  const res = {};
  const longUa = 'X'.repeat(MAX_USER_AGENT_LENGTH + 80);

  const line = JSON.parse(formatRequestLogLine(stubTokens({ ua: longUa, contentLength: '' }), req, res));
  assert.equal(line.userAgent.length, MAX_USER_AGENT_LENGTH);
  assert.equal(line.contentLength, null);
  assert.equal(line.ip, '::1');
});

test('request-logger: missing status / empty UA degrade safely', () => {
  const req = { path: '/x' };
  const res = {};
  const tokens = stubTokens({ status: '', ua: '' });
  // force empty status token
  tokens.status = () => '';

  const line = JSON.parse(formatRequestLogLine(tokens, req, res));
  assert.equal(line.status, 0);
  assert.equal(line.level, 'info');
  assert.equal(line.userAgent, '');
  assert.equal(line.ip, null);
});
