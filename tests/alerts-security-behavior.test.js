'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const alertsRouter = require('../server/routes/alerts');

test('dev verification tokens are never exposed in production', () => {
  process.env.NODE_ENV = 'production';
  process.env.ALERTS_EXPOSE_DEV_TOKENS = 'true';
  assert.equal(alertsRouter.__private.shouldExposeDevVerificationToken(), false);
});

test('dev verification tokens can be exposed outside production', () => {
  process.env.NODE_ENV = 'test';
  process.env.ALERTS_EXPOSE_DEV_TOKENS = 'true';
  assert.equal(alertsRouter.__private.shouldExposeDevVerificationToken(), true);
});
