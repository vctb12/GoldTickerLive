'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

let core;
async function loadCore() {
  if (!core) core = await import('../src/pages/deal-checker/deal-checker-core.js');
  return core;
}

const CONTEXT = { spotUsdPerOz: 2400, fxRate: 3.6725 };

function baseInput(overrides = {}) {
  return {
    ...core.DEFAULT_DEAL_INPUTS,
    quotedTotal: 2500,
    grossWeightGrams: 10,
    karat: '22',
    ...overrides,
  };
}

test('calculates fine gold and reference value from gross weight, non-gold weight, and karat', async () => {
  const { calculateDeal } = await loadCore();
  const result = calculateDeal(baseInput({ nonGoldWeightGrams: 1 }), CONTEXT);

  assert.equal(result.ok, true);
  assert.equal(result.chargeableWeight, 9);
  assert.equal(result.fineGoldGrams, 8.25);
  assert.ok(result.referenceValue > 0);
  assert.equal(result.benchmarkStatus, 'incomplete');
});

test('models per-gram making, fixed premium, percentage tax, and discount', async () => {
  const { calculateDeal } = await loadCore();
  const result = calculateDeal(
    baseInput({
      quotedTotal: 2700,
      makingMode: 'per_gram',
      makingValue: 10,
      premiumMode: 'fixed',
      premiumValue: 50,
      taxMode: 'percent',
      taxValue: 5,
      discountMode: 'fixed',
      discountValue: 25,
    }),
    CONTEXT
  );

  assert.equal(result.ok, true);
  assert.equal(result.makingTotal, 100);
  assert.equal(result.premiumTotal, 50);
  assert.equal(result.taxTotal, (result.referenceValue + 100 + 50) * 0.05);
  assert.equal(result.discountTotal, 25);
  assert.equal(result.modeledTotal, result.subtotal + result.taxTotal - 25);
  assert.ok(result.markupPerGrossGram !== null);
  assert.equal(result.actualGoldSharePct > 0, true);
});

test('keeps incomplete charge disclosures honest instead of treating unknowns as zero', async () => {
  const { calculateDeal } = await loadCore();
  const result = calculateDeal(baseInput(), CONTEXT);

  assert.equal(result.ok, true);
  assert.equal(result.modeledTotal, null);
  assert.equal(result.residual, null);
  assert.deepEqual(result.assumptions.unknownChargeFields, ['making', 'premium', 'tax']);
  assert.equal(result.benchmarkStatus, 'incomplete');
});

test('returns neutral benchmark statuses for below, within, and above configured tolerance', async () => {
  const { calculateDeal } = await loadCore();
  const reference = calculateDeal(
    baseInput({ makingMode: 'included', premiumMode: 'included', taxMode: 'included' }),
    CONTEXT
  );
  const within = calculateDeal(
    baseInput({
      quotedTotal: reference.referenceValue * 1.01,
      makingMode: 'included',
      premiumMode: 'included',
      taxMode: 'included',
    }),
    CONTEXT
  );
  const above = calculateDeal(
    baseInput({
      quotedTotal: reference.referenceValue * 1.2,
      makingMode: 'included',
      premiumMode: 'included',
      taxMode: 'included',
    }),
    CONTEXT
  );
  const below = calculateDeal(
    baseInput({
      quotedTotal: reference.referenceValue * 0.8,
      makingMode: 'included',
      premiumMode: 'included',
      taxMode: 'included',
    }),
    CONTEXT
  );

  assert.equal(within.benchmarkStatus, 'within');
  assert.equal(above.benchmarkStatus, 'above');
  assert.equal(below.benchmarkStatus, 'below');
});

test('calculates break-even spot and optional resale estimate', async () => {
  const { calculateDeal } = await loadCore();
  const result = calculateDeal(
    baseInput({
      buybackRatePct: 90,
      makingMode: 'included',
      premiumMode: 'included',
      taxMode: 'included',
    }),
    CONTEXT
  );

  assert.ok(Math.abs(result.resaleEstimate - result.referenceValue * 0.9) < 1e-9);
  assert.ok(result.breakEvenSpotUsdPerOz > 0);
  assert.ok(
    Math.abs(result.resaleGap - (result.inputs.quotedTotal - result.resaleEstimate)) < 1e-9
  );
});

test('normalizes invalid numeric and mode input safely', async () => {
  const { normalizeDealInputs, validateDealInputs } = await loadCore();
  const normalized = normalizeDealInputs({
    quotedTotal: '-2',
    grossWeightGrams: 'bad',
    makingMode: 'unexpected',
    currency: 'aed',
    shopLabel: 'x'.repeat(200),
  });

  assert.equal(normalized.quotedTotal, 0);
  assert.equal(normalized.grossWeightGrams, null);
  assert.equal(normalized.makingMode, 'unknown');
  assert.equal(normalized.currency, 'AED');
  assert.equal(normalized.shopLabel.length, 120);
  assert.equal(validateDealInputs(normalized).ok, false);
});

test('URL state excludes the private shop label and round-trips the remaining inputs', async () => {
  const { parseDealState, serializeDealState, shareableDealInputs } = await loadCore();
  const input = baseInput({ shopLabel: 'Private note', quoteTimestamp: '2026-08-04T10:00' });
  const safe = shareableDealInputs(input);
  const parsed = parseDealState(serializeDealState(input));

  assert.equal(Object.hasOwn(safe, 'shopLabel'), false);
  assert.equal(parsed.shopLabel, '');
  assert.equal(parsed.quoteTimestamp, input.quoteTimestamp);
  assert.equal(parsed.quotedTotal, input.quotedTotal);
});
