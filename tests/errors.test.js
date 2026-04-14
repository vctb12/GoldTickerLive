'use strict';

/**
 * Tests for lib/errors.js — centralized error classes and Express error handler.
 * Run with:  npm test
 */

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const {
  AppError,
  ValidationError,
  AuthError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
  errorHandler,
} = require('../lib/errors');

// ---------------------------------------------------------------------------
// Error class tests
// ---------------------------------------------------------------------------

describe('AppError', () => {
  test('creates error with defaults', () => {
    const err = new AppError('Something broke');
    assert.equal(err.message, 'Something broke');
    assert.equal(err.statusCode, 500);
    assert.equal(err.code, 'INTERNAL_ERROR');
    assert.equal(err.name, 'AppError');
  });

  test('accepts custom statusCode and code', () => {
    const err = new AppError('Bad thing', 503, 'SERVICE_UNAVAILABLE');
    assert.equal(err.statusCode, 503);
    assert.equal(err.code, 'SERVICE_UNAVAILABLE');
  });

  test('toJSON returns structured envelope', () => {
    const err = new AppError('test', 400, 'TEST');
    const json = err.toJSON();
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'TEST');
    assert.equal(json.error.message, 'test');
  });
});

describe('ValidationError', () => {
  test('has correct statusCode and code', () => {
    const err = new ValidationError('Name is required');
    assert.equal(err.statusCode, 400);
    assert.equal(err.code, 'VALIDATION_ERROR');
  });

  test('includes details in toJSON when provided', () => {
    const err = new ValidationError('Invalid fields', { name: 'required' });
    const json = err.toJSON();
    assert.deepEqual(json.error.details, { name: 'required' });
  });

  test('omits details when not provided', () => {
    const err = new ValidationError('Bad input');
    const json = err.toJSON();
    assert.equal(json.error.details, undefined);
  });
});

describe('AuthError', () => {
  test('defaults to 401', () => {
    const err = new AuthError();
    assert.equal(err.statusCode, 401);
    assert.equal(err.code, 'AUTH_ERROR');
  });
});

describe('ForbiddenError', () => {
  test('defaults to 403', () => {
    const err = new ForbiddenError();
    assert.equal(err.statusCode, 403);
    assert.equal(err.code, 'FORBIDDEN');
  });
});

describe('NotFoundError', () => {
  test('defaults to 404', () => {
    const err = new NotFoundError('Shop not found');
    assert.equal(err.statusCode, 404);
    assert.equal(err.message, 'Shop not found');
  });
});

describe('RateLimitError', () => {
  test('defaults to 429', () => {
    const err = new RateLimitError();
    assert.equal(err.statusCode, 429);
  });

  test('stores retryAfter', () => {
    const err = new RateLimitError('slow down', 120);
    assert.equal(err.retryAfter, 120);
  });
});

// ---------------------------------------------------------------------------
// errorHandler middleware tests
// ---------------------------------------------------------------------------

function makeRes() {
  const res = { _status: 200, _body: null, _headers: {} };
  res.status = (code) => {
    res._status = code;
    return res;
  };
  res.json = (body) => {
    res._body = body;
    return res;
  };
  res.set = (key, val) => {
    res._headers[key] = val;
    return res;
  };
  return res;
}

describe('errorHandler middleware', () => {
  test('handles AppError subclass with correct status and body', () => {
    const err = new NotFoundError('Shop not found');
    const res = makeRes();
    errorHandler(err, {}, res, () => {});
    assert.equal(res._status, 404);
    assert.equal(res._body.success, false);
    assert.equal(res._body.error.code, 'NOT_FOUND');
    assert.equal(res._body.error.message, 'Shop not found');
  });

  test('sets Retry-After header for RateLimitError', () => {
    const err = new RateLimitError('slow', 60);
    const res = makeRes();
    errorHandler(err, {}, res, () => {});
    assert.equal(res._status, 429);
    assert.equal(res._headers['Retry-After'], '60');
  });

  test('handles JSON parse error', () => {
    const err = new Error('bad json');
    err.type = 'entity.parse.failed';
    const res = makeRes();
    errorHandler(err, {}, res, () => {});
    assert.equal(res._status, 400);
    assert.equal(res._body.error.code, 'INVALID_JSON');
  });

  test('handles payload too large error', () => {
    const err = new Error('too large');
    err.type = 'entity.too.large';
    const res = makeRes();
    errorHandler(err, {}, res, () => {});
    assert.equal(res._status, 413);
    assert.equal(res._body.error.code, 'PAYLOAD_TOO_LARGE');
  });

  test('handles unknown errors with 500 status', () => {
    const err = new Error('unexpected');
    const res = makeRes();
    errorHandler(err, {}, res, () => {});
    assert.equal(res._status, 500);
    assert.equal(res._body.success, false);
    assert.equal(res._body.error.code, 'INTERNAL_ERROR');
  });

  test('hides error message in production mode', () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const err = new Error('secret internal detail');
      const res = makeRes();
      errorHandler(err, {}, res, () => {});
      assert.equal(res._body.error.message, 'An unexpected error occurred');
    } finally {
      if (original) process.env.NODE_ENV = original;
      else delete process.env.NODE_ENV;
    }
  });
});
