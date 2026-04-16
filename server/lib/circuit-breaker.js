'use strict';

/**
 * Circuit Breaker pattern implementation.
 *
 * Prevents cascading failures by tracking consecutive errors and temporarily
 * rejecting requests when a failure threshold is reached.
 *
 * States:
 *   CLOSED   — requests pass through normally; failures are counted.
 *   OPEN     — requests are immediately rejected; after `resetTimeout` ms
 *              the breaker moves to HALF_OPEN.
 *   HALF_OPEN — a single request is allowed through as a probe.
 *              If it succeeds the breaker returns to CLOSED; if it fails
 *              the breaker returns to OPEN.
 */

const STATES = Object.freeze({
  CLOSED: 'CLOSED',
  OPEN: 'OPEN',
  HALF_OPEN: 'HALF_OPEN',
});

class CircuitBreaker {
  /**
   * @param {object} [options]
   * @param {number} [options.failureThreshold=3]  Number of consecutive failures
   *   that trip the breaker from CLOSED → OPEN.
   * @param {number} [options.resetTimeout=60000]  Time in ms before the breaker
   *   moves from OPEN → HALF_OPEN.
   */
  constructor({ failureThreshold = 3, resetTimeout = 60000 } = {}) {
    this.failureThreshold = failureThreshold;
    this.resetTimeout = resetTimeout;
    this.state = STATES.CLOSED;
    this.failureCount = 0;
    this._openedAt = null;
  }

  /**
   * Execute `fn` through the circuit breaker.
   *
   * @template T
   * @param {() => Promise<T>} fn  Async function to execute.
   * @returns {Promise<T>}
   */
  async call(fn) {
    if (this.state === STATES.OPEN) {
      if (Date.now() - this._openedAt >= this.resetTimeout) {
        this.state = STATES.HALF_OPEN;
      } else {
        throw new Error('Circuit breaker is OPEN — request rejected');
      }
    }

    try {
      const result = await fn();
      this._onSuccess();
      return result;
    } catch (err) {
      this._onFailure();
      throw err;
    }
  }

  /** @private */
  _onSuccess() {
    this.failureCount = 0;
    this.state = STATES.CLOSED;
    this._openedAt = null;
  }

  /** @private */
  _onFailure() {
    this.failureCount++;
    if (this.failureCount >= this.failureThreshold || this.state === STATES.HALF_OPEN) {
      this.state = STATES.OPEN;
      this._openedAt = Date.now();
    }
  }

  /** Reset the breaker to its initial state. */
  reset() {
    this.state = STATES.CLOSED;
    this.failureCount = 0;
    this._openedAt = null;
  }
}

module.exports = { CircuitBreaker, STATES };
