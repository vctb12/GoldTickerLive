// Single source of truth: maps internal quote-provider ids to honest,
// user-facing source names. The label answers "who is the upstream source",
// NOT "how fresh" — freshness/staleness is surfaced separately by the freshness
// machine (Live / Cached / Stale / Closed). Never expose internal class-style
// tokens (e.g. "PrimaryProvider" / "SecondaryProvider") to users.
//
// The PrimaryQuoteProvider, the cache/fallback file, and the secondary provider
// all resolve to the same upstream: gold-api.com (served live, or from the
// hourly committed snapshot / fallback). So they all name that source honestly.
const PROVIDER_NAME_MAP = {
  'primary-provider': 'Gold-API.com',
  'live-primary': 'Live',
  gold_api_com: 'Gold-API.com',
  minted_metal: 'Minted Metal',
  'last-gold-price': 'Last Snapshot',
  'secondary-provider-cache': 'Gold-API.com',
  goldpricez: 'GoldPriceZ',
  gold_api_com_file: 'Gold-API.com',
  'cache-fallback': 'Gold-API.com',
  cache: 'Gold-API.com',
};

export function formatProviderLabel(providerId) {
  if (!providerId) return 'UnknownProvider';
  return PROVIDER_NAME_MAP[providerId] || String(providerId);
}
