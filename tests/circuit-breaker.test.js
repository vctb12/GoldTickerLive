'use strict';

/**
 * Tests for server/lib/circuit-breaker.js
 *
 * These tests use the Node.js built-in test runner (node:test).
 * Run with:  npm test
 */

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { CircuitBreaker, STATES } = require('../server/lib/circuit-breaker');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const succeed = () => Promise.resolve('ok');
const fail = () => Promise.reject(new Error('boom'));

/**
 * Trip the breaker by calling `fail` until it opens.
 * @param {CircuitBreaker} cb
 */
async function tripBreaker(cb) {
  for (let i = 0; i < cb.failureThreshold; i++) {
    await cb.call(fail).catch(() => {});
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CircuitBreaker', () => {
  test('starts in CLOSED state', () => {
    const cb = new CircuitBreaker();
    assert.equal(cb.state, STATES.CLOSED);
    assert.equal(cb.failureCount, 0);
  });

  test('stays CLOSED on successful calls', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 3 });
    await cb.call(succeed);
    await cb.call(succeed);
    assert.equal(cb.state, STATES.CLOSED);
    assert.equal(cb.failureCount, 0);
  });

  test('opens after N consecutive failures', async () => {
    const threshold = 3;
    const cb = new CircuitBreaker({ failureThreshold: threshold });

    for (let i = 0; i < threshold; i++) {
      await cb.call(fail).catch(() => {});
    }

    assert.equal(cb.state, STATES.OPEN);
    assert.equal(cb.failureCount, threshold);
  });

  test('rejects requests immediately when OPEN', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 2, resetTimeout: 60000 });
    await tripBreaker(cb);

    assert.equal(cb.state, STATES.OPEN);

    await assert.rejects(() => cb.call(succeed), {
      message: /Circuit breaker is OPEN/,
    });
  });

  test('transitions to HALF_OPEN after resetTimeout', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 2, resetTimeout: 50 });
    await tripBreaker(cb);

    assert.equal(cb.state, STATES.OPEN);

    // Wait for the reset timeout to elapse
    await new Promise((r) => setTimeout(r, 60));

    // The next call should move the breaker to HALF_OPEN and execute the fn
    const result = await cb.call(succeed);
    assert.equal(result, 'ok');
    // After a successful probe, breaker returns to CLOSED
    assert.equal(cb.state, STATES.CLOSED);
  });

  test('returns to CLOSED on successful call in HALF_OPEN', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 2, resetTimeout: 10 });
    await tripBreaker(cb);

    await new Promise((r) => setTimeout(r, 20));

    // Successful probe in HALF_OPEN should close the breaker
    await cb.call(succeed);
    assert.equal(cb.state, STATES.CLOSED);
    assert.equal(cb.failureCount, 0);
  });

  test('returns to OPEN if probe fails in HALF_OPEN', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 2, resetTimeout: 10 });
    await tripBreaker(cb);

    await new Promise((r) => setTimeout(r, 20));

    // Failed probe in HALF_OPEN should reopen the breaker
    await cb.call(fail).catch(() => {});
    assert.equal(cb.state, STATES.OPEN);
  });

  test('resets failure count on a successful call', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 3 });

    // Two failures (below threshold)
    await cb.call(fail).catch(() => {});
    await cb.call(fail).catch(() => {});
    assert.equal(cb.failureCount, 2);
    assert.equal(cb.state, STATES.CLOSED);

    // Success resets the counter
    await cb.call(succeed);
    assert.equal(cb.failureCount, 0);
    assert.equal(cb.state, STATES.CLOSED);
  });

  test('reset() restores initial state', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 2 });
    await tripBreaker(cb);
    assert.equal(cb.state, STATES.OPEN);

    cb.reset();
    assert.equal(cb.state, STATES.CLOSED);
    assert.equal(cb.failureCount, 0);
  });

  test('uses default options when none provided', () => {
    const cb = new CircuitBreaker();
    assert.equal(cb.failureThreshold, 3);
    assert.equal(cb.resetTimeout, 60000);
  });
});
