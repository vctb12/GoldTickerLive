import { applyMarketClosedOverlay, getLiveFreshness } from '../../lib/live-status.js';

/**
 * Resolve one calculator freshness truth for both the hero note and the shared
 * badge. The data key always comes from the canonical age-aware policy; only
 * the final presentation state receives the market-closed overlay.
 */
export function getCalculatorFreshness({
  updatedAt,
  lang = 'en',
  isFresh = null,
  isFallback = false,
  hasLiveFailure = false,
  now = new Date(),
} = {}) {
  const freshness = getLiveFreshness({
    updatedAt,
    lang,
    isFresh,
    isFallback,
    hasLiveFailure,
  });

  return {
    ...freshness,
    state: applyMarketClosedOverlay(freshness.key, now),
  };
}
