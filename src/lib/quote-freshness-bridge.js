/**
 * Bridges quote provider metadata to getLiveFreshness() inputs.
 *
 * The realtime engine uses freshness-policy.js (10 s live budget) for SLA metrics.
 * User-visible labels use live-status.js (30 min delayed / 75 min stale).
 * Never map engine snapshot.freshness.state onto isFresh — that mislabels
 * normal 15 s quotes as Stale.
 *
 * @param {{ isFallback?: boolean|null, isFresh?: boolean|null }|null|undefined} quote
 * @returns {boolean|null}
 */
export function resolveGoldIsFresh(quote) {
  if (quote?.isFallback === true || quote?.isFresh === false) return false;
  if (quote?.isFresh === true) return true;
  return null;
}
