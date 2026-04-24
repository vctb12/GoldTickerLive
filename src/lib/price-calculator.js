import { CONSTANTS } from '../config/index.js';

/**
 * Calculate the USD price per gram for a given karat.
 *
 * @param {number} spotUsdPerOz  XAU/USD spot price in USD per troy ounce.
 * @param {number} purity        Karat purity as a decimal fraction (e.g. 0.9999 for 24K).
 * @returns {number}  USD per gram, or `0` if inputs are falsy.
 */
export function usdPerGram(spotUsdPerOz, purity) {
  if (!spotUsdPerOz || !purity) return 0;
  return (spotUsdPerOz / CONSTANTS.TROY_OZ_GRAMS) * purity;
}

/**
 * Calculate the USD price per troy ounce for a given karat.
 *
 * @param {number} spotUsdPerOz  XAU/USD spot price in USD per troy ounce.
 * @param {number} purity        Karat purity as a decimal fraction.
 * @returns {number}  USD per troy ounce, or `0` if inputs are falsy.
 */
export function usdPerOz(spotUsdPerOz, purity) {
  if (!spotUsdPerOz || !purity) return 0;
  return spotUsdPerOz * purity;
}

/**
 * Convert a USD price to local currency using the given exchange rate.
 *
 * @param {number|null} usdPrice  Price in USD.
 * @param {number|null} fxRate    Exchange rate: 1 USD = `fxRate` local currency units.
 * @returns {number|null}  Local currency price, or `null` if either input is falsy.
 */
export function localPrice(usdPrice, fxRate) {
  if (!usdPrice || !fxRate) return null;
  return usdPrice * fxRate;
}

/**
 * Compute per-gram and per-ounce prices for every karat/country combination in
 * a single pass, avoiding redundant multiplications.
 *
 * AED is always computed from the hardcoded `CONSTANTS.AED_PEG` peg — it is
 * never derived from the `rates` object, which explicitly excludes AED.
 *
 * @param {number}   spotUsdPerOz  XAU/USD spot price in USD per troy ounce.
 * @param {Record<string, number>} rates  FX rates (currency code → USD rate). Must not contain AED;
 *   AED is always computed from the hardcoded `CONSTANTS.AED_PEG` peg to prevent API drift.
 * @param {Array<{ code: string, purity: number }>} karats  Karat definitions.
 * @param {Array<{ currency: string }>}              countries  Country definitions.
 * @returns {Record<string, Record<string, { gram: number, oz: number } | null>>}
 *   Nested map: `prices[karatCode][currencyCode] = { gram, oz }`, or `null` when
 *   the FX rate for a currency is unavailable.
 */
export function calculateAllPrices(spotUsdPerOz, rates, karats, countries) {
  if (!spotUsdPerOz || !rates) return {};
  const prices = {};
  const troyOzGrams = CONSTANTS.TROY_OZ_GRAMS;
  const aedPeg = CONSTANTS.AED_PEG;

  // Pre-calculate base USD prices per karat to avoid redundant calculations
  const basePrices = {};
  for (const karat of karats) {
    const purity = karat.purity;
    basePrices[karat.code] = {
      usdPerGram: (spotUsdPerOz / troyOzGrams) * purity,
      usdPerOz: spotUsdPerOz * purity,
    };
  }

  for (const karat of karats) {
    const base = basePrices[karat.code];
    prices[karat.code] = {
      USD: { gram: base.usdPerGram, oz: base.usdPerOz },
      AED: { gram: base.usdPerGram * aedPeg, oz: base.usdPerOz * aedPeg },
    };

    for (const country of countries) {
      if (country.currency === 'AED') continue;
      const rate = rates[country.currency];
      prices[karat.code][country.currency] = rate
        ? { gram: base.usdPerGram * rate, oz: base.usdPerOz * rate }
        : null;
    }
  }

  return prices;
}

/**
 * Calculate the coefficient of variation (% standard deviation / mean) for the
 * last `days` entries in a price history array. Returns `null` when the slice
 * contains fewer than two valid data points.
 *
 * @param {Array<{ price: number }>} history  Chronologically-ordered price history.
 * @param {number}                   days     Number of tail entries to include.
 * @returns {number|null}  Volatility as a percentage, or `null` on insufficient data.
 */
export function calculateVolatility(history, days) {
  if (!Array.isArray(history) || history.length < 2) return null;
  const slice = history
    .slice(-days)
    .map((h) => h.price)
    .filter(Boolean);
  if (slice.length < 2) return null;
  const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
  const variance = slice.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / slice.length;
  return (Math.sqrt(variance) / mean) * 100;
}
