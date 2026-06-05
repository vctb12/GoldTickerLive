const PROVIDER_NAME_MAP = {
  'primary-provider': 'PrimaryProvider',
  'live-primary': 'Live',
  gold_api_com: 'Gold-API.com',
  minted_metal: 'Minted Metal',
  'last-gold-price': 'Last Snapshot',
  'secondary-provider-cache': 'SecondaryProvider',
  goldpricez: 'GoldPriceZ',
  gold_api_com_file: 'Gold-API.com',
  'cache-fallback': 'SecondaryProvider',
  cache: 'SecondaryProvider',
};

export function formatProviderLabel(providerId) {
  if (!providerId) return 'UnknownProvider';
  return PROVIDER_NAME_MAP[providerId] || String(providerId);
}
