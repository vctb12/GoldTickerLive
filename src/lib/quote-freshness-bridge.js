/**
 * Bridges quote provider metadata to getLiveFreshness() inputs.
 *
 * The realtime engine uses freshness-policy.js (5 s live budget) for SLA metrics.
 * User-visible labels use getLiveFreshness(): live API quotes (isFresh === true)
 * follow the same 5 s / 60 s budgets; hourly cron paths keep 30 min / 75 min.
 * Never map engine snapshot.freshness.state onto isFresh — that mislabels quotes.
 *
 * @param {{ isFallback?: boolean|null, isFresh?: boolean|null }|null|undefined} quote
 * @returns {boolean|null}
 */
export function resolveGoldIsFresh(quote) {
  if (quote?.isFallback === true || quote?.isFresh === false) return false;
  if (quote?.isFresh === true) return true;
  return null;
}
