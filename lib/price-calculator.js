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

  for (const karat of karats) {
    prices[karat.code] = {
      USD: {
        gram: usdPerGram(spotUsdPerOz, karat.purity),
        oz: usdPerOz(spotUsdPerOz, karat.purity),
      },
      AED: {
        gram: usdPerGram(spotUsdPerOz, karat.purity) * CONSTANTS.AED_PEG,
        oz: usdPerOz(spotUsdPerOz, karat.purity) * CONSTANTS.AED_PEG,
      },
    };

    for (const country of countries) {
      if (country.currency === 'AED') continue; // AED already set above
      const rate = rates[country.currency];
      if (rate) {
        prices[karat.code][country.currency] = {
          gram: usdPerGram(spotUsdPerOz, karat.purity) * rate,
          oz: usdPerOz(spotUsdPerOz, karat.purity) * rate,
        };
      } else {
        prices[karat.code][country.currency] = null; // Currency not in FX data
      }
    }
  }

  return prices;
}

export function calculateVolatility(history, days) {
  if (!Array.isArray(history) || history.length < 2) return null;
  const slice = history.slice(-days).map(h => h.price).filter(Boolean);
  if (slice.length < 2) return null;
  const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
  const variance = slice.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / slice.length;
  return (Math.sqrt(variance) / mean) * 100;
}
