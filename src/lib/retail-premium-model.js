/**
 * lib/retail-premium-model.js — the country/local retail-premium model (Phase 53).
 *
 * The site shows a spot-linked *reference* estimate (spot × purity × FX, AED via the fixed peg).
 * Real retail gold costs MORE than reference: a jeweller adds a **making charge** (labour / design)
 * and, in some jurisdictions, **VAT** applies. This module makes that relationship explicit and
 * computes an ILLUSTRATIVE retail band from a reference price.
 *
 * Honesty first: making charges vary by shop, product, and country, so this module does NOT encode a
 * table of fabricated per-country premiums. The premium inputs are caller-supplied; the defaults are
 * the same 5–25% making-charge band already cited in the FAQ and used by `ShopVsReferencePanel`, and
 * VAT defaults to 0 (so the default output reproduces the existing panel exactly). Every result
 * carries the "illustrative estimate — not retail pricing and not financial advice" framing.
 *
 * Pure and side-effect-free. It never touches the spot/peg/troy math or the displayed reference
 * price — it only layers an explicitly-labelled illustrative premium on top of a reference value.
 */

/** Illustrative jewellery making-charge band (matches the 5–25% cited in the FAQ + panel). */
export const DEFAULT_MAKING_LOW = 0.05;
export const DEFAULT_MAKING_HIGH = 0.25;

const DISCLAIMER = {
  en: 'Illustrative retail band — reference gold value plus a typical making charge (and VAT where it applies). Actual shop prices vary by product and jeweller. Not retail pricing and not financial advice.',
  ar: 'نطاق تجزئة توضيحي — قيمة الذهب المرجعية مضافًا إليها رسوم تصنيع نموذجية (وضريبة القيمة المضافة حيثما تُطبَّق). تختلف أسعار المتاجر الفعلية حسب المنتج والصائغ. وليس سعر تجزئة ولا نصيحة مالية.',
};

function pickLang(lang) {
  return lang === 'ar' ? 'ar' : 'en';
}

function round(value, dp = 2) {
  const f = 10 ** dp;
  return Math.round(value * f) / f;
}

function isNonNegFinite(n) {
  return Number.isFinite(n) && n >= 0;
}

/**
 * Build an illustrative retail band from a reference price.
 *
 * retailPreVat = reference × (1 + makingCharge)
 * vat          = (vatOnMakingOnly ? makingAmount : retailPreVat) × vatRatePct/100
 * retail       = retailPreVat + vat
 *
 * @param {object} input
 * @param {number} input.referenceLocal   Reference gold value in local currency (> 0).
 * @param {string} [input.currency]       Currency code (label only). Default 'AED'.
 * @param {number} [input.makingLow]      Low making-charge fraction (default 0.05).
 * @param {number} [input.makingHigh]     High making-charge fraction (default 0.25).
 * @param {number} [input.vatRatePct]     VAT percent applied to retail (default 0 — none assumed).
 * @param {boolean} [input.vatOnMakingOnly]  Apply VAT to the making charge only (default false).
 * @param {number} [input.decimals]       Rounding for the output amounts (default 2).
 * @param {{ lang?: 'en'|'ar' }} [options]
 * @returns {{ status:'ok'|'unavailable', currency?:string, referenceLocal?:number, low?:number, high?:number, band?:[number,number], makingLow?:number, makingHigh?:number, vatRatePct?:number, disclaimer:string }}
 */
export function buildRetailPremiumBand(input = {}, options = {}) {
  const lang = pickLang(options.lang);
  const disclaimer = DISCLAIMER[lang];

  const reference = Number(input.referenceLocal);
  const currency = (input.currency || 'AED').toUpperCase();
  const makingLow = input.makingLow == null ? DEFAULT_MAKING_LOW : Number(input.makingLow);
  const makingHigh = input.makingHigh == null ? DEFAULT_MAKING_HIGH : Number(input.makingHigh);
  const vatRatePct = input.vatRatePct == null ? 0 : Number(input.vatRatePct);
  const vatOnMakingOnly = Boolean(input.vatOnMakingOnly);
  const decimals = Number.isInteger(input.decimals) ? input.decimals : 2;

  const valid =
    Number.isFinite(reference) &&
    reference > 0 &&
    isNonNegFinite(makingLow) &&
    isNonNegFinite(makingHigh) &&
    makingLow <= makingHigh &&
    isNonNegFinite(vatRatePct) &&
    vatRatePct <= 100;

  if (!valid) {
    return { status: 'unavailable', disclaimer };
  }

  const retail = (makingFraction) => {
    const makingAmount = reference * makingFraction;
    const preVat = reference + makingAmount;
    const vatBase = vatOnMakingOnly ? makingAmount : preVat;
    const vat = vatBase * (vatRatePct / 100);
    return round(preVat + vat, decimals);
  };

  const low = retail(makingLow);
  const high = retail(makingHigh);

  return {
    status: 'ok',
    currency,
    referenceLocal: round(reference, decimals),
    low,
    high,
    band: [low, high],
    makingLow,
    makingHigh,
    vatRatePct,
    disclaimer,
  };
}

/** Human-readable one-line render of a retail band. */
export function renderRetailPremiumBand(model, options = {}) {
  const lang = pickLang(options.lang);
  if (!model || model.status !== 'ok') {
    const unavailable = lang === 'ar' ? 'النطاق غير متاح.' : 'Band unavailable.';
    return `${unavailable}\n${DISCLAIMER[lang]}`;
  }
  const { currency, referenceLocal, low, high } = model;
  const ref = lang === 'ar' ? 'المرجع' : 'Reference';
  const shop = lang === 'ar' ? 'نطاق المتجر التوضيحي' : 'Illustrative shop range';
  return [
    `${ref}: ${referenceLocal} ${currency}`,
    `${shop}: ${low} – ${high} ${currency}`,
    model.disclaimer,
  ].join('\n');
}
