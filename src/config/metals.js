/**
 * config/metals.js — precious-metals data-layer foundation.
 *
 * A single registry that generalises the site's gold maths to silver, platinum and palladium so a
 * future phase can add them to the tools **without changing anything about gold**. This module is
 * foundation only: it is not wired into any live page yet (Phase 33+ does that), and gold's numbers
 * are guaranteed byte-identical to the existing path (see `tests/metals.test.js`).
 *
 * Design rules:
 *   1. Gold is the primary metal. Its purities ARE the existing `KARATS` — reused, not re-declared —
 *      so nothing about gold can drift.
 *   2. Every metal prices with the **same** formula the gold code already uses:
 *      `(spot per troy ounce × purity) ÷ grams per troy ounce`, using the shared
 *      `CONSTANTS.TROY_OZ_GRAMS` (31.1035) and, for AED, the fixed peg 3.6725 — both immutable.
 *   3. Non-gold metals use fineness grades (fine / sterling / coin), not karats.
 */

import { CONSTANTS } from './constants.js';
import { KARATS } from './karats.js';

/** The one live metal today; everything else is a pilot behind a future toggle. */
export const PRIMARY_METAL = 'gold';

/**
 * @typedef {Object} MetalPurity
 * @property {string} code       Short grade code (karat number, or fineness like '999').
 * @property {number} purity     Fraction of pure metal (0–1).
 * @property {string} labelEn
 * @property {string} labelAr
 */

/**
 * @typedef {Object} Metal
 * @property {string} key        'gold' | 'silver' | 'platinum' | 'palladium'
 * @property {string} symbol     Spot symbol used by gold-api.com etc. (XAU/XAG/XPT/XPD).
 * @property {string} nameEn
 * @property {string} nameAr
 * @property {boolean} primary   True only for gold.
 * @property {MetalPurity[]} purities  Available fineness grades, richest first.
 * @property {string} defaultPurity    Default grade `code`.
 */

/** @type {Record<string, Metal>} */
export const METALS = {
  gold: {
    key: 'gold',
    symbol: 'XAU',
    nameEn: 'Gold',
    nameAr: 'الذهب',
    primary: true,
    // Gold's grades are the existing karat table verbatim — never re-declared here.
    purities: KARATS.map((k) => ({
      code: k.code,
      purity: k.purity,
      labelEn: k.labelEn,
      labelAr: k.labelAr,
    })),
    defaultPurity: '24',
  },
  silver: {
    key: 'silver',
    symbol: 'XAG',
    nameEn: 'Silver',
    nameAr: 'الفضة',
    primary: false,
    purities: [
      { code: '999', purity: 0.999, labelEn: 'Fine silver (.999)', labelAr: 'فضة نقية (.999)' },
      { code: '925', purity: 0.925, labelEn: 'Sterling (.925)', labelAr: 'إسترليني (.925)' },
      { code: '900', purity: 0.9, labelEn: 'Coin silver (.900)', labelAr: 'فضة عملات (.900)' },
    ],
    defaultPurity: '999',
  },
  platinum: {
    key: 'platinum',
    symbol: 'XPT',
    nameEn: 'Platinum',
    nameAr: 'البلاتين',
    primary: false,
    purities: [
      { code: '999', purity: 0.999, labelEn: 'Fine platinum (.999)', labelAr: 'بلاتين نقي (.999)' },
      { code: '950', purity: 0.95, labelEn: 'Jewellery (.950)', labelAr: 'مجوهرات (.950)' },
    ],
    defaultPurity: '999',
  },
  palladium: {
    key: 'palladium',
    symbol: 'XPD',
    nameEn: 'Palladium',
    nameAr: 'البلاديوم',
    primary: false,
    purities: [
      {
        code: '999',
        purity: 0.999,
        labelEn: 'Fine palladium (.999)',
        labelAr: 'بلاديوم نقي (.999)',
      },
      { code: '950', purity: 0.95, labelEn: 'Jewellery (.950)', labelAr: 'مجوهرات (.950)' },
    ],
    defaultPurity: '999',
  },
};

/** All metal keys, primary (gold) first. */
export function metalKeys() {
  return Object.keys(METALS).sort((a, b) =>
    a === PRIMARY_METAL ? -1 : b === PRIMARY_METAL ? 1 : 0
  );
}

/** Look up a metal by key; falls back to gold for any unknown key. */
export function getMetal(key) {
  return METALS[key] || METALS[PRIMARY_METAL];
}

/**
 * Spot-linked value of one gram of a metal at a given purity, in USD.
 *
 * This is the SAME expression the gold code already uses — `(spot × purity) ÷ troyOzGrams` — so gold
 * is byte-identical and every other metal shares one formula. Returns `null` on non-finite input.
 *
 * @param {number} spotUsdPerOz  Spot price per troy ounce, USD.
 * @param {number} purity        Fraction of pure metal (0–1).
 * @param {number} [troyOzGrams] Grams per troy ounce (defaults to the immutable constant).
 * @returns {number|null}
 */
export function metalUsdPerGram(spotUsdPerOz, purity, troyOzGrams = CONSTANTS.TROY_OZ_GRAMS) {
  if (!Number.isFinite(spotUsdPerOz) || !Number.isFinite(purity) || !Number.isFinite(troyOzGrams)) {
    return null;
  }
  return (spotUsdPerOz * purity) / troyOzGrams;
}

/**
 * Convert a USD/gram value to AED/gram using the fixed peg (3.6725). Kept here so metals share the
 * one immutable peg rather than re-deriving it.
 * @param {number} usdPerGram
 * @returns {number|null}
 */
export function usdToAedPerGram(usdPerGram) {
  if (!Number.isFinite(usdPerGram)) return null;
  return usdPerGram * CONSTANTS.AED_PEG;
}
