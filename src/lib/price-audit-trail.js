/**
 * lib/price-audit-trail.js — a transparent, reproducible derivation of a reference price (Phase 49).
 *
 * Records every step from live spot to the displayed per-gram reference estimate, so any shown price
 * is auditable: `spot XAU/USD ÷ 31.1035 (troy oz → gram) × karat purity × FX`. AED uses the fixed
 * 3.6725 peg. Pure and side-effect-free — it re-derives the exact same result the pricing layer uses
 * (`(spot × purity) / TROY_OZ_GRAMS × fx`), it does not introduce a second formula.
 *
 * The immutable constants (troy-oz 31.1035, AED peg 3.6725) come from `CONSTANTS` and are NEVER
 * altered here. Every trail carries the spot-linked, bullion-equivalent reference-estimate framing —
 * it is not retail pricing and not financial advice.
 */

import { CONSTANTS } from '../config/index.js';

const TROY = CONSTANTS.TROY_OZ_GRAMS; // 31.1035
const AED_PEG = CONSTANTS.AED_PEG; // 3.6725

const DISCLAIMER = {
  en: 'Spot-linked, bullion-equivalent reference estimate — not retail pricing and not financial advice.',
  ar: 'تقدير مرجعي مرتبط بالسعر الفوري وما يعادله من السبائك — وليس سعر تجزئة ولا نصيحة مالية.',
};

function pickLang(lang) {
  return lang === 'ar' ? 'ar' : 'en';
}

function round(value, dp = 4) {
  const f = 10 ** dp;
  return Math.round(value * f) / f;
}

function isPos(n) {
  return Number.isFinite(n) && n > 0;
}

/**
 * Build the ordered derivation of a per-gram reference price.
 *
 * @param {object} input
 * @param {number} input.spotUsdPerOz  Live XAU/USD per troy ounce (> 0).
 * @param {number} input.purity        Fractional purity in (0, 1] (e.g. 22/24). Required.
 * @param {string} [input.karatCode]   Display label for the grade (e.g. '22').
 * @param {string} [input.currency]    Target currency code (default 'AED').
 * @param {number} [input.fxRate]      USD→currency rate. For AED, defaults to the fixed 3.6725 peg.
 * @param {{ lang?: 'en'|'ar' }} [options]
 * @returns {{ status:'ok'|'unavailable', currency?:string, steps?:object[], finalPerGram?:number, unit?:string, disclaimer:string }}
 */
export function buildPriceAuditTrail(input = {}, options = {}) {
  const lang = pickLang(options.lang);
  const disclaimer = DISCLAIMER[lang];

  const spot = Number(input.spotUsdPerOz);
  const purity = Number(input.purity);
  const currency = (input.currency || 'AED').toUpperCase();
  const isAed = currency === 'AED';
  const fxRate = isAed && input.fxRate == null ? AED_PEG : Number(input.fxRate);

  if (!isPos(spot) || !isPos(purity) || purity > 1 || !isPos(fxRate)) {
    return { status: 'unavailable', disclaimer };
  }

  const usdPerGram24k = spot / TROY;
  const usdPerGram = usdPerGram24k * purity;
  const localPerGram = usdPerGram * fxRate;
  const karat = input.karatCode ? String(input.karatCode) : null;

  const L = (en, ar) => (lang === 'ar' ? ar : en);
  const pegNote = isAed ? L(' (fixed peg)', ' (ربط ثابت)') : '';

  const steps = [
    {
      key: 'spot',
      label: L('Live spot price', 'السعر الفوري المباشر'),
      operation: L('XAU/USD per troy ounce', 'XAU/USD لكل أونصة تروي'),
      input: null,
      output: round(spot, 2),
      unit: 'USD/oz',
    },
    {
      key: 'per-gram',
      label: L('Convert ounce → gram', 'تحويل الأونصة إلى جرام'),
      operation: `÷ ${TROY}`,
      input: round(spot, 2),
      output: round(usdPerGram24k),
      unit: 'USD/g (24K)',
    },
    {
      key: 'purity',
      label: L('Apply karat purity', 'تطبيق نقاء العيار'),
      operation: `× ${round(purity, 6)}${karat ? ` (${karat}K)` : ''}`,
      input: round(usdPerGram24k),
      output: round(usdPerGram),
      unit: `USD/g${karat ? ` (${karat}K)` : ''}`,
    },
    {
      key: 'fx',
      label: L('Convert to local currency', 'التحويل إلى العملة المحلية'),
      operation: `× ${fxRate}${pegNote}`,
      input: round(usdPerGram),
      output: round(localPerGram),
      unit: `${currency}/g${karat ? ` (${karat}K)` : ''}`,
    },
  ];

  return {
    status: 'ok',
    currency,
    karatCode: karat,
    fxRate,
    isAedPeg: isAed,
    steps,
    finalPerGram: round(localPerGram),
    unit: `${currency}/g${karat ? ` (${karat}K)` : ''}`,
    disclaimer,
  };
}

/** Human-readable one-line-per-step render of a trail. */
export function renderPriceAuditTrail(trail, options = {}) {
  const lang = pickLang(options.lang);
  if (!trail || trail.status !== 'ok') {
    return lang === 'ar' ? 'التقدير غير متاح.' : 'Estimate unavailable.';
  }
  const lines = trail.steps.map((s) => {
    const from = s.input == null ? '' : `${s.input} `;
    return `${s.label}: ${from}${s.operation} = ${s.output} ${s.unit}`;
  });
  lines.push(`= ${trail.finalPerGram} ${trail.unit}`);
  lines.push(trail.disclaimer);
  return lines.join('\n');
}
