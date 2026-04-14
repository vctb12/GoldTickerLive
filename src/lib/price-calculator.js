import { CONSTANTS } from '../config/index.js';

export function usdPerGram(spotUsdPerOz, purity) {
  if (!spotUsdPerOz || !purity) return 0;
  return (spotUsdPerOz / CONSTANTS.TROY_OZ_GRAMS) * purity;
}

export function usdPerOz(spotUsdPerOz, purity) {
  if (!spotUsdPerOz || !purity) return 0;
  return spotUsdPerOz * purity;
}

export function localPrice(usdPrice, fxRate) {
  if (!usdPrice || !fxRate) return null;
  return usdPrice * fxRate;
}

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
