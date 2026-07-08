/**
 * lib/price-audit-trail.js — a transparent, reproducible derivation of a reference price (Phase 49).
 *
 * Records every step from live spot to the displayed per-gram reference estimate, so any shown price
 * is auditable: `spot XAU/USD ÷ 31.1035 (troy oz → gram) × karat purity × FX`. AED uses the fixed
 * 3.6725 peg. Pure and side-effect-free — it re-derives the exact same result the pricing layer uses
 * (`(spot × purity) / TROY_OZ_GRAMS × fx`), it does not introduce a second formula.
 *
 * Self-consistent by construction: each step derives its `output` from the *displayed* (rounded)
 * `input` of the previous step, so a reader who multiplies the shown figures by hand reproduces every
 * shown output exactly — the audit trail cannot silently disagree with its own arithmetic.
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

  const spotRaw = Number(input.spotUsdPerOz);
  const purityRaw = Number(input.purity);
  const currency = (input.currency || 'AED').toUpperCase();
  const isAed = currency === 'AED';
  // AED defaults to the fixed peg only when the caller supplies no explicit rate.
  const usedDefaultPeg = isAed && input.fxRate == null;
  const fxRate = usedDefaultPeg ? AED_PEG : Number(input.fxRate);

  if (!isPos(spotRaw) || !isPos(purityRaw) || purityRaw > 1 || !isPos(fxRate)) {
    return { status: 'unavailable', disclaimer };
  }

  // Chain the DISPLAYED (rounded) value forward at every step: each output is computed from the
  // exact figure shown as the previous step's output, so multiplying the shown numbers by hand
  // reproduces the trail. Spot shows to the cent (USD/oz); per-gram values to 4 dp.
  const spot = round(spotRaw, 2);
  const purity = round(purityRaw, 6);
  const usdPerGram24k = round(spot / TROY, 4);
  const usdPerGram = round(usdPerGram24k * purity, 4);
  const localPerGram = round(usdPerGram * fxRate, 4);

  // Only call it the fixed peg when the value actually is the peg — a custom AED rate is not.
  const isPeg = isAed && fxRate === AED_PEG;
  const karat = input.karatCode ? String(input.karatCode) : null;

  const L = (en, ar) => (lang === 'ar' ? ar : en);
  const pegNote = isPeg ? L(' (fixed peg)', ' (ربط ثابت)') : '';

  const steps = [
    {
      key: 'spot',
      label: L('Live spot price', 'السعر الفوري المباشر'),
      operation: L('XAU/USD per troy ounce', 'XAU/USD لكل أونصة تروي'),
      input: null,
      output: spot,
      unit: 'USD/oz',
    },
    {
      key: 'per-gram',
      label: L('Convert ounce → gram', 'تحويل الأونصة إلى جرام'),
      operation: `÷ ${TROY}`,
      input: spot,
      output: usdPerGram24k,
      unit: 'USD/g (24K)',
    },
    {
      key: 'purity',
      label: L('Apply karat purity', 'تطبيق نقاء العيار'),
      operation: `× ${purity}${karat ? ` (${karat}K)` : ''}`,
      input: usdPerGram24k,
      output: usdPerGram,
      unit: `USD/g${karat ? ` (${karat}K)` : ''}`,
    },
    {
      key: 'fx',
      label: L('Convert to local currency', 'التحويل إلى العملة المحلية'),
      operation: `× ${fxRate}${pegNote}`,
      input: usdPerGram,
      output: localPerGram,
      unit: `${currency}/g${karat ? ` (${karat}K)` : ''}`,
    },
  ];

  return {
    status: 'ok',
    currency,
    karatCode: karat,
    fxRate,
    isAedPeg: isPeg,
    steps,
    finalPerGram: localPerGram,
    unit: `${currency}/g${karat ? ` (${karat}K)` : ''}`,
    disclaimer,
  };
}

/** Human-readable one-line-per-step render of a trail. The framing rides on every trail — including
 * the unavailable case, so the disclaimer is never dropped. */
export function renderPriceAuditTrail(trail, options = {}) {
  const lang = pickLang(options.lang);
  if (!trail || trail.status !== 'ok') {
    const unavailable = lang === 'ar' ? 'التقدير غير متاح.' : 'Estimate unavailable.';
    // Localise the framing to the render language so it is never dropped and never mismatched.
    return `${unavailable}\n${DISCLAIMER[lang]}`;
  }
  const lines = trail.steps.map((s) => {
    const from = s.input == null ? '' : `${s.input} `;
    return `${s.label}: ${from}${s.operation} = ${s.output} ${s.unit}`;
  });
  lines.push(`= ${trail.finalPerGram} ${trail.unit}`);
  lines.push(trail.disclaimer);
  return lines.join('\n');
}
