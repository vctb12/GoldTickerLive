import { CONSTANTS, KARATS } from '../../config/index.js';

const NUMBER_FIELDS = [
  'quotedTotal',
  'grossWeightGrams',
  'nonGoldWeightGrams',
  'makingValue',
  'premiumValue',
  'taxValue',
  'discountValue',
  'buybackRatePct',
  'benchmarkTolerancePct',
];

const MODES = {
  making: new Set(['unknown', 'per_gram', 'fixed', 'percent', 'included']),
  premium: new Set(['unknown', 'percent', 'fixed', 'included']),
  tax: new Set(['unknown', 'percent', 'included']),
  discount: new Set(['none', 'percent', 'fixed']),
};

export const DEFAULT_DEAL_INPUTS = Object.freeze({
  currency: 'AED',
  purchaseType: 'jewelry',
  karat: '22',
  quotedTotal: null,
  grossWeightGrams: null,
  nonGoldWeightGrams: 0,
  makingMode: 'unknown',
  makingValue: null,
  premiumMode: 'unknown',
  premiumValue: null,
  taxMode: 'unknown',
  taxValue: null,
  discountMode: 'none',
  discountValue: 0,
  buybackRatePct: null,
  benchmarkTolerancePct: 2.5,
  shopLabel: '',
  quoteTimestamp: '',
});

function numberOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function clampNonNegative(value) {
  return value === null ? null : Math.max(0, value);
}

function findKarat(karat) {
  return KARATS.find((item) => item.code === String(karat)) || null;
}

function calculateComponent(mode, value, base) {
  if (mode === 'percent') return value === null ? null : (base * value) / 100;
  if (mode === 'per_gram') return value === null ? null : value * base;
  if (mode === 'fixed') return value;
  if (mode === 'included' || mode === 'none') return 0;
  return null;
}

function hasValue(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

export function normalizeDealInputs(input = {}) {
  const normalized = { ...DEFAULT_DEAL_INPUTS, ...input };
  for (const field of NUMBER_FIELDS)
    normalized[field] = clampNonNegative(numberOrNull(normalized[field]));
  normalized.karat = String(normalized.karat || DEFAULT_DEAL_INPUTS.karat);
  normalized.currency = String(normalized.currency || DEFAULT_DEAL_INPUTS.currency).toUpperCase();
  normalized.makingMode = MODES.making.has(normalized.makingMode)
    ? normalized.makingMode
    : 'unknown';
  normalized.premiumMode = MODES.premium.has(normalized.premiumMode)
    ? normalized.premiumMode
    : 'unknown';
  normalized.taxMode = MODES.tax.has(normalized.taxMode) ? normalized.taxMode : 'unknown';
  normalized.discountMode = MODES.discount.has(normalized.discountMode)
    ? normalized.discountMode
    : 'none';
  normalized.shopLabel = String(normalized.shopLabel || '').slice(0, 120);
  normalized.quoteTimestamp = String(normalized.quoteTimestamp || '').slice(0, 40);
  return normalized;
}

export function validateDealInputs(input) {
  const normalized = normalizeDealInputs(input);
  const errors = [];
  if (!findKarat(normalized.karat)) errors.push('karat');
  if (!(normalized.quotedTotal > 0)) errors.push('quotedTotal');
  if (!(normalized.grossWeightGrams > 0)) errors.push('grossWeightGrams');
  if (
    normalized.nonGoldWeightGrams >= normalized.grossWeightGrams &&
    normalized.grossWeightGrams > 0
  ) {
    errors.push('nonGoldWeightGrams');
  }
  return { ok: errors.length === 0, errors, inputs: normalized };
}

/**
 * Calculate a neutral comparison between a seller quote and the current
 * spot-linked reference estimate. Unknown charge fields stay unknown instead
 * of being silently treated as zero in the completeness result.
 */
export function calculateDeal(input, context = {}) {
  const validation = validateDealInputs(input);
  const normalized = validation.inputs;
  const spotUsdPerOz = numberOrNull(context.spotUsdPerOz);
  const fxRate = numberOrNull(context.fxRate);
  const karat = findKarat(normalized.karat);
  const tolerancePct = normalized.benchmarkTolerancePct ?? 2.5;

  if (!validation.ok || !(spotUsdPerOz > 0) || !(fxRate > 0) || !karat) {
    return {
      ok: false,
      errors: [
        ...validation.errors,
        ...(spotUsdPerOz > 0 ? [] : ['spotUsdPerOz']),
        ...(fxRate > 0 ? [] : ['fxRate']),
      ],
      inputs: normalized,
    };
  }

  const chargeableWeight = Math.max(
    normalized.grossWeightGrams - (normalized.nonGoldWeightGrams || 0),
    0
  );
  const fineGoldGrams = chargeableWeight * karat.purity;
  const referencePerFineGram = (spotUsdPerOz / CONSTANTS.TROY_OZ_GRAMS) * fxRate;
  const referenceValue = fineGoldGrams * referencePerFineGram;
  const referencePerGrossGram = referenceValue / normalized.grossWeightGrams;
  const impliedQuotedPerGrossGram = normalized.quotedTotal / normalized.grossWeightGrams;

  const makingBase = normalized.makingMode === 'per_gram' ? chargeableWeight : referenceValue;
  const makingTotal = calculateComponent(normalized.makingMode, normalized.makingValue, makingBase);
  const premiumTotal = calculateComponent(
    normalized.premiumMode,
    normalized.premiumValue,
    referenceValue
  );
  const subtotal = [referenceValue, makingTotal, premiumTotal].every(hasValue)
    ? referenceValue + makingTotal + premiumTotal
    : null;
  const taxTotal =
    normalized.taxMode === 'percent'
      ? calculateComponent(normalized.taxMode, normalized.taxValue, subtotal)
      : normalized.taxMode === 'included'
        ? 0
        : null;
  const discountTotal = calculateComponent(
    normalized.discountMode,
    normalized.discountValue,
    subtotal
  );
  const modeledTotal = [subtotal, taxTotal, discountTotal].every(hasValue)
    ? subtotal + taxTotal - discountTotal
    : null;
  const residual = modeledTotal === null ? null : normalized.quotedTotal - modeledTotal;
  const actualMarkup = normalized.quotedTotal - referenceValue;
  const actualMarkupPct = referenceValue > 0 ? (actualMarkup / referenceValue) * 100 : null;
  const markupPerGrossGram =
    normalized.grossWeightGrams > 0 ? actualMarkup / normalized.grossWeightGrams : null;
  const actualGoldSharePct =
    normalized.quotedTotal > 0 ? (referenceValue / normalized.quotedTotal) * 100 : null;
  const breakEvenSpotUsdPerOz =
    fineGoldGrams > 0 && fxRate > 0
      ? (normalized.quotedTotal * CONSTANTS.TROY_OZ_GRAMS) / (fineGoldGrams * fxRate)
      : null;
  const resaleEstimate =
    normalized.buybackRatePct === null ? null : (referenceValue * normalized.buybackRatePct) / 100;

  const toleranceValue = normalized.quotedTotal * (tolerancePct / 100);
  const benchmarkStatus =
    residual === null
      ? 'incomplete'
      : Math.abs(residual) <= Math.max(1, toleranceValue)
        ? 'within'
        : residual > 0
          ? 'above'
          : 'below';

  return {
    ok: true,
    inputs: normalized,
    karat: { code: karat.code, purity: karat.purity },
    spotUsdPerOz,
    fxRate,
    chargeableWeight,
    fineGoldGrams,
    referencePerFineGram,
    referenceValue,
    referencePerGrossGram,
    impliedQuotedPerGrossGram,
    makingTotal,
    premiumTotal,
    subtotal,
    taxTotal,
    discountTotal,
    modeledTotal,
    residual,
    actualMarkup,
    actualMarkupPct,
    markupPerGrossGram,
    actualGoldSharePct,
    breakEvenSpotUsdPerOz,
    resaleEstimate,
    resaleGap: resaleEstimate === null ? null : normalized.quotedTotal - resaleEstimate,
    benchmarkStatus,
    benchmarkToleranceValue: toleranceValue,
    assumptions: {
      makingBasis: 'chargeable_weight',
      referenceDefinition: 'fine_gold_weight_times_spot_per_gram',
      unknownChargeFields: [
        normalized.makingMode === 'unknown' ? 'making' : null,
        normalized.premiumMode === 'unknown' ? 'premium' : null,
        normalized.taxMode === 'unknown' ? 'tax' : null,
      ].filter(Boolean),
    },
  };
}

export function shareableDealInputs(input) {
  const normalized = normalizeDealInputs(input);
  const { shopLabel: _shopLabel, ...safe } = normalized;
  return safe;
}

export function serializeDealState(input) {
  return encodeURIComponent(JSON.stringify(shareableDealInputs(input)));
}

export function parseDealState(value) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(value));
    return normalizeDealInputs(parsed);
  } catch {
    return null;
  }
}
