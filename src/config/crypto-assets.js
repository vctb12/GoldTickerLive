/**
 * config/crypto-assets.js — registry for the crypto price-history pilot (BTC, optional ETH).
 *
 * Foundation/plumbing only — NO UI, no live data. It exists so a future gold-vs-crypto correlation
 * view (Phase 37) can pull crypto history through the *same* `historical-data.js` pipeline the gold
 * chart already uses. Everything is OFF until (a) the owner adds a crypto price feed and (b) the flag
 * below is flipped. Nothing here touches gold.
 *
 * Framing rule (carried from the roadmap): crypto is shown for **descriptive comparison only** —
 * correlation, not causation, and never a prediction or investment signal.
 */

/** Master switch for anything crypto-facing. MUST stay false until a real feed + a UI phase exist. */
export const CRYPTO_PILOT_ENABLED = false;

/** The lead crypto asset for the pilot. */
export const PRIMARY_CRYPTO = 'btc';

/**
 * @typedef {Object} CryptoAsset
 * @property {string} key       'btc' | 'eth'
 * @property {string} symbol    Pair symbol used by feeds (BTC/USD, ETH/USD).
 * @property {string} nameEn
 * @property {string} nameAr
 * @property {number} decimals  Display decimals for USD price.
 * @property {boolean} primary
 */

/** @type {Record<string, CryptoAsset>} */
export const CRYPTO_ASSETS = {
  btc: {
    key: 'btc',
    symbol: 'BTC/USD',
    nameEn: 'Bitcoin',
    nameAr: 'بيتكوين',
    decimals: 0,
    primary: true,
  },
  eth: {
    key: 'eth',
    symbol: 'ETH/USD',
    nameEn: 'Ethereum',
    nameAr: 'إيثيريوم',
    decimals: 0,
    primary: false,
  },
};

/** All crypto keys, primary first. */
export function cryptoKeys() {
  return Object.keys(CRYPTO_ASSETS).sort((a, b) =>
    a === PRIMARY_CRYPTO ? -1 : b === PRIMARY_CRYPTO ? 1 : 0
  );
}

/** Look up a crypto asset by key; null for unknown keys (unlike metals, no gold-style fallback). */
export function getCryptoAsset(key) {
  return CRYPTO_ASSETS[key] || null;
}
