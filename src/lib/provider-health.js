const WINDOW_MS = 30 * 60 * 1000;

// ── Hysteresis (Phase 47) ────────────────────────────────────────────────────
// The freshness label flapped between Live / Cached / Fallback / SecondaryProvider on repeated loads
// because a SINGLE failed fetch (a transient gold-api.com timeout or 429) instantly marked the
// provider unhealthy, and the next success instantly restored it. A Schmitt-trigger fixes that:
// it takes N consecutive failures to trip UNHEALTHY and M consecutive successes to recover HEALTHY,
// and the state is sticky in between — so one blip no longer moves the UI.
//
// This is health smoothing only. It never overrides age-based truth: staleness is still governed by
// `freshness-policy.js` (live/cached/delayed budgets), so smoothing health can't make old data look
// live — it only stops a lone transient failure from screaming "fallback".
const TRIP_AFTER_FAILURES = 2; // consecutive failures required to go UNHEALTHY
const RECOVER_AFTER_SUCCESSES = 2; // consecutive successes required to return HEALTHY
// Once provider selection switches, hold it for a cooldown so the active provider can't oscillate.
const FAILOVER_COOLDOWN_MS = 45 * 1000;

/** Error types (from `error.name`) that mean "the request timed out", for diagnostics/logging. */
const TIMEOUT_ERROR_TYPES = new Set(['AbortError', 'TimeoutError']);
/** Error types / markers that mean "rate limited", for diagnostics/logging. */
const RATE_LIMIT_ERROR_TYPES = new Set(['RateLimitError', 'rate_limited', 'http_429']);

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
}

export class ProviderHealthMonitor {
  constructor(nowFn = () => Date.now()) {
    this.nowFn = nowFn;
    this.providers = new Map();
    this.activeProviderId = null;
    this.lastSwitchAt = 0;
  }

  ensure(providerId) {
    if (!this.providers.has(providerId)) {
      this.providers.set(providerId, {
        providerId,
        attempts: [],
        consecutiveFailures: 0,
        consecutiveSuccesses: 0,
        lastSuccessAt: 0,
        lastFailureAt: 0,
        // Sticky health with hysteresis. Providers start healthy (optimistic) until they trip.
        healthy: true,
      });
    }
    return this.providers.get(providerId);
  }

  recordAttempt(
    providerId,
    { success, latencyMs = null, providerTimestamp = null, errorType = null } = {}
  ) {
    const now = this.nowFn();
    const provider = this.ensure(providerId);

    provider.attempts.push({
      at: now,
      success: Boolean(success),
      latencyMs: Number.isFinite(latencyMs) ? latencyMs : null,
      providerTimestamp,
      errorType,
    });

    provider.attempts = provider.attempts.filter((entry) => now - entry.at <= WINDOW_MS);

    if (success) {
      provider.lastSuccessAt = now;
      provider.consecutiveFailures = 0;
      provider.consecutiveSuccesses += 1;
      // Recover only after a SUSTAINED run of successes — not on the first good poll.
      if (!provider.healthy && provider.consecutiveSuccesses >= RECOVER_AFTER_SUCCESSES) {
        provider.healthy = true;
      }
    } else {
      provider.lastFailureAt = now;
      provider.consecutiveSuccesses = 0;
      provider.consecutiveFailures += 1;
      // Trip only after SUSTAINED failures — a single transient blip is absorbed.
      if (provider.healthy && provider.consecutiveFailures >= TRIP_AFTER_FAILURES) {
        provider.healthy = false;
      }
    }

    return this.getSnapshot(providerId);
  }

  getSnapshot(providerId) {
    const provider = this.ensure(providerId);
    const attempts = provider.attempts;
    const successes = attempts.filter((entry) => entry.success);
    const failures = attempts.filter((entry) => !entry.success);
    const latencies = successes
      .map((entry) => entry.latencyMs)
      .filter((value) => Number.isFinite(value) && value >= 0);

    const successRate = attempts.length ? successes.length / attempts.length : 1;

    // Diagnostics for logging — how the primary is actually failing over the window.
    const timeoutCount = failures.filter((e) => TIMEOUT_ERROR_TYPES.has(e.errorType)).length;
    const rateLimitedCount = failures.filter((e) => RATE_LIMIT_ERROR_TYPES.has(e.errorType)).length;

    return {
      providerId,
      attempts: attempts.length,
      successRate,
      consecutiveFailures: provider.consecutiveFailures,
      consecutiveSuccesses: provider.consecutiveSuccesses,
      medianLatencyMs: median(latencies),
      p95LatencyMs: percentile(latencies, 95),
      lastSuccessAt: provider.lastSuccessAt || null,
      lastFailureAt: provider.lastFailureAt || null,
      failureCount: failures.length,
      timeoutCount,
      rateLimitedCount,
      healthy: provider.healthy,
      // Back-compat alias — some callers read `failureDetectionBreached`.
      failureDetectionBreached: !provider.healthy,
    };
  }

  setActiveProvider(providerId) {
    if (providerId && this.activeProviderId !== providerId) {
      this.activeProviderId = providerId;
      this.lastSwitchAt = this.nowFn();
    }
  }

  canSwitchProvider() {
    // Once switched, hold for a cooldown so provider selection can't oscillate either.
    return this.nowFn() - this.lastSwitchAt >= FAILOVER_COOLDOWN_MS;
  }
}
