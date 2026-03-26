export const CONSTANTS = {
  API_GOLD_URL: 'https://api.gold-api.com/price/XAU',
  API_FX_URL: 'https://open.er-api.com/v6/latest/USD',
  AED_PEG: 3.6725,
  TROY_OZ_GRAMS: 31.1035,
  GOLD_REFRESH_MS: 90000,
  GOLD_FETCH_TIMEOUT: 8000,
  FX_FETCH_TIMEOUT: 8000,
  HISTORY_DAYS: 90,
  CACHE_KEYS: {
    goldPrice: 'gold_price_cache',
    goldFallback: 'gold_price_fallback',
    fxRates: 'fx_rates_cache',
    fxFallback: 'fx_rates_fallback',
    dayOpen: 'gold_day_open',
    history: 'gold_price_history',
    userPrefs: 'user_prefs',
  },
};
