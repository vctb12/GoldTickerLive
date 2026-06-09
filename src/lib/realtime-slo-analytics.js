import { track, EVENTS } from './analytics.js';

const THROTTLE_MS = 30_000;
let lastKey = '';
let lastAt = 0;

/**
 * Throttled REALTIME_SLO analytics — no PII, state transitions only.
 * @param {object} snapshot — engine snapshot()
 * @param {'home'|'tracker'|string} surface
 */
export function maybeTrackRealtimeSlo(snapshot, surface) {
  if (!snapshot?.metrics || !surface) return;

  const freshnessState = snapshot.freshness?.state || 'unknown';
  const providerId = snapshot.activeProviderId || snapshot.quote?.providerId || 'unknown';
  const key = `${surface}|${freshnessState}|${providerId}|${snapshot.metrics.p95RefreshIntervalMs}`;
  const now = Date.now();
  if (key === lastKey && now - lastAt < THROTTLE_MS) return;

  lastKey = key;
  lastAt = now;

  track(EVENTS.REALTIME_SLO, {
    surface,
    provider_id: String(providerId),
    freshness_state: String(freshnessState),
    p95_refresh_ms: Math.round(snapshot.metrics.p95RefreshIntervalMs ?? 0),
    next_poll_ms: Math.round(snapshot.metrics.nextPollInMs ?? 0),
  });
}
