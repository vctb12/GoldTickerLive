/**
 * services/pricingEngine.js
 * Single source of truth for all price calculations.
 * Formula: usdPerGram = (spotUsdPerOz / 31.1035) * purity
 *          localPerGram = usdPerGram * fxRate
 *
 * Dependencies: config/countries.js, config/karats.js, config/constants.js
 */
import { CONSTANTS } from '../config/index.js';
import { COUNTRIES } from '../config/countries.js';
import { KARATS } from '../config/karats.js';

const TROY_OZ_GRAMS = CONSTANTS.TROY_OZ_GRAMS; // 31.1035
const TOLA_GRAMS = 11.6638;
const AED_PEG = CONSTANTS.AED_PEG; // 3.6725

/**
 * Calculate prices for all country × karat combinations.
 * @param {number} spotUsdPerOz  XAU/USD spot price
 * @param {object} fxRates       { currency: rate } — AED will be overridden with peg
 * @returns {object}  Keyed by `${countryCode}_${karatCode}`, each value:
 *   { usdPerGram, usdPerOz, usdPerTola, localPerGram, localPerOz, localPerTola,
 *     currency, karat, country, fxRate, fxSource }
 */
export function calculateAllPrices(spotUsdPerOz, fxRates = {}) {
  if (!spotUsdPerOz || spotUsdPerOz <= 0) return {};
  const prices = {};

  // Pre-calc USD base per karat (avoids repeated division)
  const baseUsd = {};
  for (const karat of KARATS) {
    const usdPerGram = (spotUsdPerOz / TROY_OZ_GRAMS) * karat.purity;
    baseUsd[karat.code] = {
      usdPerGram,
      usdPerOz: spotUsdPerOz * karat.purity,
      usdPerTola: usdPerGram * TOLA_GRAMS,
    };
  }

  for (const country of COUNTRIES) {
    const isAED = country.currency === 'AED';
    const fxRate = isAED ? AED_PEG : (fxRates[country.currency] ?? null);
    const fxSource = isAED ? 'fixed-peg' : (fxRate ? 'api' : 'unavailable');

    for (const karat of KARATS) {
      const base = baseUsd[karat.code];
      const key = `${country.code}_${karat.code}`;
      prices[key] = {
        usdPerGram:    base.usdPerGram,
        usdPerOz:      base.usdPerOz,
        usdPerTola:    base.usdPerTola,
        localPerGram:  fxRate ? base.usdPerGram * fxRate : null,
        localPerOz:    fxRate ? base.usdPerOz   * fxRate : null,
        localPerTola:  fxRate ? base.usdPerTola * fxRate : null,
        currency:      country.currency,
        karat:         karat.code,
        country:       country.code,
        fxRate,
        fxSource,
      };
    }
  }
  return prices;
}

/**
 * Calculate price for a single karat in a single currency.
 * @param {number} spotUsdPerOz
 * @param {string} karatCode  e.g. '24', '22', '21', '18'
 * @param {number} fxRate     local-currency/USD rate (use 3.6725 for AED)
 * @param {'gram'|'oz'|'tola'} unit
 * @returns {number|null}
 */
export function calcPrice(spotUsdPerOz, karatCode, fxRate, unit = 'gram') {
  if (!spotUsdPerOz || !fxRate) return null;
  const karat = KARATS.find(k => k.code === String(karatCode));
  if (!karat) return null;
  const usdPerGram = (spotUsdPerOz / TROY_OZ_GRAMS) * karat.purity;
  switch (unit) {
    case 'oz':   return usdPerGram * TROY_OZ_GRAMS * fxRate;
    case 'tola': return usdPerGram * TOLA_GRAMS * fxRate;
    default:     return usdPerGram * fxRate;
  }
}
