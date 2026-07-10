/**
 * lib/crypto-snapshot.js — gold-vs-crypto current-snapshot comparison view-model (Phase 62, Theme C).
 *
 * Theme C is a *descriptive* gold-vs-crypto comparison. Phase 37 already built the statistical
 * correlation view (`gold-crypto-correlation.js`) and Phase 36 the history plumbing
 * (`crypto-history.js`); this adds the missing piece — a current-value snapshot row per crypto asset
 * (BTC, optional ETH) with honest states, so a page can show gold alongside crypto today.
 *
 * Honesty first (roadmap framing): crypto is shown for **descriptive comparison only** — correlation
 * is not causation, and it is never a prediction or investment signal. No asset without a live feed
 * shows a number: it is `pending-data` (pilot on, no feed) or `disabled` (pilot off). AED is a plain
 * USD→AED conversion via the fixed peg (the peg applies to any USD value; it is used, never altered).
 *
 * Fully wired but gated by `CRYPTO_PILOT_ENABLED` (default OFF). Pure and side-effect-free; touches
 * nothing about gold's pricing.
 */

import { cryptoKeys, getCryptoAsset, CRYPTO_PILOT_ENABLED } from '../config/crypto-assets.js';
import { CONSTANTS } from '../config/index.js';

const AED_PEG = CONSTANTS.AED_PEG; // 3.6725 (USD→AED)

const DISCLAIMER = {
  en: 'For descriptive comparison only — correlation is not causation, and this is not a prediction or investment signal. Not financial advice.',
  ar: 'لأغراض المقارنة الوصفية فقط — الارتباط ليس سببية، وهذا ليس تنبؤًا ولا إشارة استثمار. وليس نصيحة مالية.',
};

function pickLang(lang) {
  return lang === 'ar' ? 'ar' : 'en';
}

function round(value, dp = 0) {
  const f = 10 ** Math.max(0, dp);
  return Math.round(value * f) / f;
}

/** Keep only finite, positive spot values so a missing/corrupt feed degrades to pending-data. */
export function normalizeCryptoSpotMap(raw = {}) {
  const clean = {};
  for (const [key, value] of Object.entries(raw || {})) {
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) clean[key] = n;
  }
  return clean;
}

/**
 * Build the gold-vs-crypto snapshot model.
 *
 * @param {Record<string, number>} spotByAsset  USD spot per crypto key (e.g. { btc: 68000 }).
 * @param {{ pilotEnabled?: boolean, lang?: 'en'|'ar' }} [options]
 * @returns {{ pilotEnabled: boolean, rows: object[], disclaimer: string }}
 */
export function buildCryptoSnapshot(spotByAsset = {}, options = {}) {
  const pilotEnabled = options.pilotEnabled ?? CRYPTO_PILOT_ENABLED;
  const lang = pickLang(options.lang);
  const spots = normalizeCryptoSpotMap(spotByAsset);

  const rows = cryptoKeys().map((key) => {
    const asset = getCryptoAsset(key);
    let state = 'ok';
    let usd = null;
    let aed = null;
    if (!pilotEnabled) {
      state = 'disabled';
    } else if (!(key in spots)) {
      state = 'pending-data';
    } else {
      usd = round(spots[key], asset.decimals);
      aed = round(spots[key] * AED_PEG, asset.decimals);
    }
    return {
      key,
      name: lang === 'ar' ? asset.nameAr : asset.nameEn,
      symbol: asset.symbol,
      primary: Boolean(asset.primary),
      state,
      usd,
      aed,
    };
  });

  return { pilotEnabled, rows, disclaimer: DISCLAIMER[lang] };
}

/** Whether the crypto snapshot should mount (owner-gated; default OFF via the crypto pilot flag). */
export function isCryptoSnapshotEnabled(opts = {}) {
  return (opts.pilotEnabled ?? CRYPTO_PILOT_ENABLED) === true;
}
