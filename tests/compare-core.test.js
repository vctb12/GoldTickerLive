'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

// compare-core is an ES module; load it dynamically inside an async helper.
let core;
async function load() {
  if (!core) core = await import('../src/pages/compare/compare-core.js');
  return core;
}

const COUNTRIES = [
  {
    code: 'AE',
    slug: 'uae',
    nameEn: 'United Arab Emirates',
    nameAr: 'الإمارات',
    currency: 'AED',
    flag: '🇦🇪',
    decimals: 2,
    fixedPeg: true,
    group: 'gcc',
  },
  {
    code: 'SA',
    slug: 'saudi-arabia',
    nameEn: 'Saudi Arabia',
    nameAr: 'السعودية',
    currency: 'SAR',
    flag: '🇸🇦',
    decimals: 2,
    group: 'gcc',
  },
  {
    code: 'KW',
    slug: 'kuwait',
    nameEn: 'Kuwait',
    nameAr: 'الكويت',
    currency: 'KWD',
    flag: '🇰🇼',
    decimals: 3,
    group: 'gcc',
  },
  {
    code: 'XX',
    slug: 'nowhere',
    nameEn: 'Nowhere',
    nameAr: 'لا مكان',
    currency: 'ZZZ',
    flag: '',
    decimals: 2,
    group: 'other',
  },
];

const INTEL = {
  AE: { vatRate: 0.05, makingChargeMin: 0.08, makingChargeMax: 0.3 },
  SA: { vatRate: 0.15, makingChargeMin: 0.1, makingChargeMax: 0.35 },
  KW: { vatRate: 0, makingChargeMin: 0.08, makingChargeMax: 0.28 },
};
const getIntel = (code) => INTEL[code] || {};

const RATES = { SAR: 3.75, KWD: 0.307 };
const SPOT = 2400; // USD/oz

test('karatPurity returns fraction over 24 and guards bad input', async () => {
  const { karatPurity } = await load();
  assert.equal(karatPurity('24'), 1);
  assert.equal(karatPurity('22'), 22 / 24);
  assert.equal(karatPurity('0'), 0);
  assert.equal(karatPurity('abc'), 0);
});

test('fxRateFor uses the fixed AED peg and never the rates object', async () => {
  const { fxRateFor } = await load();
  assert.equal(fxRateFor({ currency: 'AED' }, { AED: 9.99 }), 3.6725);
  assert.equal(fxRateFor({ currency: 'SAR' }, RATES), 3.75);
  assert.equal(fxRateFor({ currency: 'ZZZ' }, RATES), null);
});

test('buildComparisonRows computes spot + all-in retail estimate', async () => {
  const { buildComparisonRows } = await load();
  const rows = buildComparisonRows({
    spotUsdPerOz: SPOT,
    rates: RATES,
    countries: COUNTRIES,
    karat: '22',
    getIntel,
  });
  const ae = rows.find((r) => r.code === 'AE');
  const expectedUsdPerGram = (SPOT / 31.1035) * (22 / 24);
  assert.ok(Math.abs(ae.spotUsdPerGram - expectedUsdPerGram) < 1e-6);
  // local = usd * peg
  assert.ok(Math.abs(ae.spotLocalPerGram - expectedUsdPerGram * 3.6725) < 1e-6);
  // retail = gold * (1 + makingMid) * (1 + vat)
  const makingMid = (0.08 + 0.3) / 2;
  const expectedRetail = expectedUsdPerGram * (1 + makingMid) * 1.05;
  assert.ok(Math.abs(ae.retailUsdPerGram - expectedRetail) < 1e-6);
});

test('buildComparisonRows flags unavailable rows when FX missing', async () => {
  const { buildComparisonRows } = await load();
  const rows = buildComparisonRows({
    spotUsdPerOz: SPOT,
    rates: RATES,
    countries: COUNTRIES,
    karat: '22',
    getIntel,
  });
  const xx = rows.find((r) => r.code === 'XX');
  assert.equal(xx.available, false);
  assert.equal(xx.retailUsdPerGram, null);
  assert.equal(xx.spotLocalPerGram, null);
});

test('buildComparisonRows returns null spot when spot is zero', async () => {
  const { buildComparisonRows } = await load();
  const rows = buildComparisonRows({
    spotUsdPerOz: 0,
    rates: RATES,
    countries: COUNTRIES,
    karat: '22',
    getIntel,
  });
  assert.equal(rows[0].spotUsdPerGram, null);
  assert.equal(rows[0].available, false);
});

test('annotatePctVsUae is 0 for UAE and signed for others', async () => {
  const { buildComparisonRows, annotatePctVsUae } = await load();
  const rows = annotatePctVsUae(
    buildComparisonRows({
      spotUsdPerOz: SPOT,
      rates: RATES,
      countries: COUNTRIES,
      karat: '22',
      getIntel,
    })
  );
  const ae = rows.find((r) => r.code === 'AE');
  const sa = rows.find((r) => r.code === 'SA');
  const xx = rows.find((r) => r.code === 'XX');
  assert.equal(ae.pctVsUae, 0);
  // Saudi has higher VAT (15%) → retail above UAE → positive pct
  assert.ok(sa.pctVsUae > 0);
  assert.equal(xx.pctVsUae, null);
});

test('sortRows sorts ascending/descending and sinks missing values', async () => {
  const { buildComparisonRows, sortRows } = await load();
  const rows = buildComparisonRows({
    spotUsdPerOz: SPOT,
    rates: RATES,
    countries: COUNTRIES,
    karat: '22',
    getIntel,
  });
  const asc = sortRows(rows, 'retailUsd', 'asc');
  // last row must be the unavailable one
  assert.equal(asc[asc.length - 1].code, 'XX');
  const available = asc.filter((r) => r.available);
  for (let i = 1; i < available.length; i += 1) {
    assert.ok(available[i - 1].retailUsdPerGram <= available[i].retailUsdPerGram);
  }
  const desc = sortRows(rows, 'retailUsd', 'desc');
  assert.equal(desc[desc.length - 1].code, 'XX'); // missing still last
});

test('sortRows by name is alphabetical', async () => {
  const { buildComparisonRows, sortRows } = await load();
  const rows = buildComparisonRows({
    spotUsdPerOz: SPOT,
    rates: RATES,
    countries: COUNTRIES,
    karat: '22',
    getIntel,
  });
  const byName = sortRows(rows, 'name', 'asc').map((r) => r.nameEn);
  const sorted = [...byName].sort((a, b) => a.localeCompare(b));
  assert.deepEqual(byName, sorted);
});

test('computeCheapest returns the lowest available retail estimate', async () => {
  const { buildComparisonRows, computeCheapest } = await load();
  const rows = buildComparisonRows({
    spotUsdPerOz: SPOT,
    rates: RATES,
    countries: COUNTRIES,
    karat: '22',
    getIntel,
  });
  const cheapest = computeCheapest(rows);
  // Kuwait: 0 VAT, lower making → cheapest of the three GCC
  assert.equal(cheapest.code, 'KW');
});

test('computeCheapest returns null when no rows available', async () => {
  const { computeCheapest } = await load();
  assert.equal(computeCheapest([{ available: false, retailUsdPerGram: null }]), null);
  assert.equal(computeCheapest([]), null);
});

test('sanitizeCodes dedupes, uppercases, filters invalid and clamps to MAX_COMPARE', async () => {
  const { sanitizeCodes, MAX_COMPARE } = await load();
  const valid = ['AE', 'SA', 'KW', 'QA', 'BH', 'OM', 'EG'];
  const out = sanitizeCodes(['ae', 'AE', 'sa', 'zz', 'kw', 'qa', 'bh', 'om', 'eg'], valid);
  assert.equal(out.length, MAX_COMPARE);
  assert.deepEqual(out.slice(0, 3), ['AE', 'SA', 'KW']);
  assert.ok(!out.includes('ZZ'));
});

test('parseCompareHash reads codes + karat with defaults', async () => {
  const { parseCompareHash, DEFAULT_COMPARE_CODES } = await load();
  const valid = ['AE', 'SA', 'KW', 'QA'];
  assert.deepEqual(parseCompareHash('#compare=sa,kw&k=24', valid), {
    codes: ['SA', 'KW'],
    karat: '24',
  });
  // bad karat falls back to 22
  assert.equal(parseCompareHash('#compare=sa&k=99', valid).karat, '22');
  // empty hash → defaults
  assert.deepEqual(parseCompareHash('', valid).codes, DEFAULT_COMPARE_CODES);
});

test('serializeCompareHash round-trips with parseCompareHash', async () => {
  const { serializeCompareHash, parseCompareHash } = await load();
  const valid = ['AE', 'SA', 'KW', 'QA'];
  const hash = serializeCompareHash({ codes: ['AE', 'QA'], karat: '21' });
  assert.equal(hash, 'compare=ae,qa&k=21');
  assert.deepEqual(parseCompareHash('#' + hash, valid), { codes: ['AE', 'QA'], karat: '21' });
});
