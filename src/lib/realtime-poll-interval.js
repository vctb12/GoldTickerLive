/** Provider IDs that return seconds-level spot from a live HTTP API. */
const LIVE_PROVIDER_IDS = new Set(['gold_api_com']);

/** Provider IDs backed by hourly cron / twice-daily LBMA / committed JSON. */
const STATIC_PROVIDER_IDS = new Set(['minted_metal', 'primary-provider', 'last-gold-price']);

/** Provider IDs that only serve recent local cache — never live. */
const FALLBACK_PROVIDER_IDS = new Set(['secondary-provider-cache', 'cache', 'cache-fallback']);

/**
 * Resolve the next poll delay from the active quote provider.
 * Live APIs poll every ~1 s; static sources slow down to avoid wasted requests.
 *
 * @param {string|null|undefined} providerId
 * @param {{
 *   livePollMs?: number,
 *   staticPollMs?: number,
 *   fallbackPollMs?: number,
 *   activePollMs?: number,
 *   hiddenPollMs?: number,
 *   visible?: boolean,
 * }} [options]
 * @returns {number}
 */
export function resolveProviderPollMs(
  providerId,
  {
    livePollMs = 1000,
    staticPollMs = 30_000,
    fallbackPollMs = 60_000,
    activePollMs = 1000,
    hiddenPollMs = 20_000,
    visible = true,
  } = {}
) {
  if (!visible) return hiddenPollMs;
  if (!providerId) return activePollMs;
  if (LIVE_PROVIDER_IDS.has(providerId)) return livePollMs;
  if (STATIC_PROVIDER_IDS.has(providerId)) return staticPollMs;
  if (FALLBACK_PROVIDER_IDS.has(providerId)) return fallbackPollMs;
  return activePollMs;
}
