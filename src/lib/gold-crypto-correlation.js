/**
 * lib/gold-crypto-correlation.js — descriptive gold-vs-crypto correlation view model.
 *
 * Phase 37. Turns two dated price series (gold history + a normalised crypto series from
 * `crypto-history.js`) into a *view model* the UI can render: an overall coefficient, a plain-word
 * strength/direction label (EN + AR), and an optional rolling-correlation series — all built on the
 * pure math in `correlation.js`. There is NO live fetch and NO chart here; this is the model layer.
 *
 * `buildCorrelationView` is the public entry and is gated behind `CRYPTO_PILOT_ENABLED`: until the
 * owner adds a crypto feed and a UI phase flips the flag, it returns a `disabled` state and the
 * module tree-shakes out (it is unimported). `computeCorrelationModel` is the flag-independent core
 * (kept separate so the math/assembly is unit-testable without touching the pilot switch). Gold is
 * untouched.
 *
 * Framing rule (non-negotiable): correlation is descriptive only. It is never a prediction, a
 * forecast, a causal claim, or an investment signal. Both the `disclaimer` and `framing` fields
 * carry that wording so no caller can render a coefficient without it.
 */

import { alignSeriesByDate, pearson, rollingCorrelation } from './correlation.js';
import { CRYPTO_PILOT_ENABLED, PRIMARY_CRYPTO, getCryptoAsset } from '../config/crypto-assets.js';

/** Minimum aligned points before a coefficient is meaningful enough to show. */
export const MIN_CORRELATION_POINTS = 3;

/** Default rolling window (in aligned points). */
export const DEFAULT_ROLLING_WINDOW = 12;

const STRENGTH = [
  { key: 'negligible', max: 0.2, en: 'negligible', ar: 'لا تُذكر' },
  { key: 'weak', max: 0.4, en: 'weak', ar: 'ضعيفة' },
  { key: 'moderate', max: 0.6, en: 'moderate', ar: 'متوسطة' },
  { key: 'strong', max: 0.8, en: 'strong', ar: 'قوية' },
  { key: 'very-strong', max: Infinity, en: 'very strong', ar: 'قوية جدًا' },
];

const DIRECTION = {
  positive: { key: 'positive', en: 'move together', ar: 'يتحركان معًا' },
  inverse: { key: 'inverse', en: 'move inversely', ar: 'يتحركان عكسيًا' },
  none: { key: 'none', en: 'show no clear link', ar: 'بلا علاقة واضحة' },
};

const DISCLAIMER = {
  en: 'Descriptive correlation over the shared dates only — not a prediction, forecast, or investment signal. Correlation does not imply causation.',
  ar: 'ارتباط وصفي على التواريخ المشتركة فقط — وليس تنبؤًا أو توقعًا أو إشارة استثمارية. الارتباط لا يعني السببية.',
};

function classifyStrength(coefficient) {
  const magnitude = Math.abs(coefficient);
  return STRENGTH.find((band) => magnitude < band.max) || STRENGTH[STRENGTH.length - 1];
}

function classifyDirection(coefficient) {
  const strength = classifyStrength(coefficient);
  if (strength.key === 'negligible') return DIRECTION.none;
  return coefficient > 0 ? DIRECTION.positive : DIRECTION.inverse;
}

function pickLang(lang) {
  return lang === 'ar' ? 'ar' : 'en';
}

/**
 * Flag-independent core: align the two series and build the descriptive model, or an empty state.
 * Statuses: `unavailable` (unknown asset), `insufficient-data` (too few points / no variance),
 * or `ok`. Never returns `disabled` — that is the pilot gate's job (see {@link buildCorrelationView}).
 *
 * @param {Array<{date:string, price:number}>} goldRecords
 * @param {Array<{date:string, price:number}>} cryptoRecords
 * @param {{assetKey?:string, lang?:'en'|'ar', window?:number}} [options]
 */
export function computeCorrelationModel(goldRecords, cryptoRecords, options = {}) {
  const lang = pickLang(options.lang);
  const disclaimer = DISCLAIMER[lang];

  const assetKey = options.assetKey || PRIMARY_CRYPTO;
  const asset = getCryptoAsset(assetKey);
  if (!asset) {
    return { status: 'unavailable', reason: 'unknown-asset', disclaimer };
  }

  const { dates, a, b } = alignSeriesByDate(goldRecords, cryptoRecords);
  if (dates.length < MIN_CORRELATION_POINTS) {
    return { status: 'insufficient-data', assetKey, sampleSize: dates.length, disclaimer };
  }

  const coefficient = pearson(a, b);
  if (coefficient === null) {
    // Aligned but no variance (e.g. a flat series) — undefined correlation, not zero.
    return { status: 'insufficient-data', assetKey, sampleSize: dates.length, disclaimer };
  }

  const strengthBand = classifyStrength(coefficient);
  const directionBand = classifyDirection(coefficient);
  const window = Number.isFinite(options.window) ? options.window : DEFAULT_ROLLING_WINDOW;

  return {
    status: 'ok',
    assetKey,
    sampleSize: dates.length,
    coefficient,
    strength: { key: strengthBand.key, label: strengthBand[lang] },
    direction: { key: directionBand.key, label: directionBand[lang] },
    rolling: rollingCorrelation(dates, a, b, window),
    framing: describeCorrelation(coefficient, asset, lang),
    disclaimer,
  };
}

/**
 * Public entry: gated by the pilot flag. Returns a `disabled` state until a crypto feed and a UI
 * phase turn the pilot on; otherwise delegates to {@link computeCorrelationModel}.
 *
 * @param {Array<{date:string, price:number}>} goldRecords
 * @param {Array<{date:string, price:number}>} cryptoRecords
 * @param {{assetKey?:string, lang?:'en'|'ar', window?:number}} [options]
 */
export function buildCorrelationView(goldRecords, cryptoRecords, options = {}) {
  if (!CRYPTO_PILOT_ENABLED) {
    return {
      status: 'disabled',
      reason: 'pilot-disabled',
      disclaimer: DISCLAIMER[pickLang(options.lang)],
    };
  }
  return computeCorrelationModel(goldRecords, cryptoRecords, options);
}

/**
 * One-line plain-language summary, e.g. "Gold and Bitcoin showed a moderate correlation — they move
 * together (r = 0.52)." Descriptive only — the disclaimer still travels with the model.
 */
export function describeCorrelation(coefficient, asset, lang = 'en') {
  const l = pickLang(lang);
  const strength = classifyStrength(coefficient);
  const direction = classifyDirection(coefficient);
  const name = l === 'ar' ? asset.nameAr : asset.nameEn;
  const r = coefficient.toFixed(2);
  if (l === 'ar') {
    return `أظهر الذهب و${name} علاقة ${strength.ar} (${direction.ar}) بمعامل ارتباط r = ${r}.`;
  }
  return `Gold and ${name} showed a ${strength.en} correlation — they ${direction.en} (r = ${r}).`;
}
