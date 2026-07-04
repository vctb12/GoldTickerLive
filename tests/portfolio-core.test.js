'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

// portfolio-core is an ES module; load it dynamically inside an async helper.
let core;
async function load() {
  if (!core) core = await import('../src/pages/portfolio/portfolio-core.js');
  return core;
}

const SPOT = 4000; // XAU/USD per troy oz
const TROY = 31.1035; // src/config/constants.js TROY_OZ_GRAMS
const AED_PEG = 3.6725;
const RATES = { SAR: 3.75, KWD: 0.31 };

function holdingFixture(overrides = {}) {
  return {
    id: 'h1',
    label: 'Wedding bangle',
    weightGrams: 10,
    karat: '22',
    purchaseDate: '2026-01-15',
    costTotal: 4000,
    costCurrency: 'AED',
    ...overrides,
  };
}

// ── purityFor / fxForCurrency ─────────────────────────────────────────────────

test('purityFor uses the canonical karat table', async () => {
  const m = await load();
  assert.equal(m.purityFor('24'), 1);
  assert.equal(m.purityFor('22'), 22 / 24);
  assert.equal(m.purityFor('18'), 18 / 24);
  assert.equal(m.purityFor('99'), null);
});

test('fxForCurrency honours USD identity and the fixed AED peg', async () => {
  const m = await load();
  assert.equal(m.fxForCurrency('USD', {}), 1);
  assert.equal(m.fxForCurrency('AED', {}), AED_PEG, 'AED must come from the peg, never rates');
  assert.equal(m.fxForCurrency('AED', { AED: 99 }), AED_PEG);
  assert.equal(m.fxForCurrency('SAR', RATES), 3.75);
  assert.equal(m.fxForCurrency('ZZZ', RATES), null);
  assert.equal(m.fxForCurrency('SAR', { SAR: -1 }), null);
});

// ── sanitizeHolding ───────────────────────────────────────────────────────────

test('sanitizeHolding accepts a valid holding and normalises fields', async () => {
  const m = await load();
  const clean = m.sanitizeHolding(
    holdingFixture({ label: '  Wedding bangle  ', weightGrams: '10.5', costTotal: '4000.999' }),
    { now: '2026-07-04' }
  );
  assert.ok(clean);
  assert.equal(clean.label, 'Wedding bangle');
  assert.equal(clean.weightGrams, 10.5);
  assert.equal(clean.costTotal, 4001);
  assert.equal(clean.costCurrency, 'AED');
});

test('sanitizeHolding rejects invalid input', async () => {
  const m = await load();
  const now = { now: '2026-07-04' };
  assert.equal(m.sanitizeHolding(null, now), null);
  assert.equal(m.sanitizeHolding(holdingFixture({ weightGrams: 0 }), now), null);
  assert.equal(m.sanitizeHolding(holdingFixture({ weightGrams: -5 }), now), null);
  assert.equal(m.sanitizeHolding(holdingFixture({ karat: '23' }), now), null);
  assert.equal(m.sanitizeHolding(holdingFixture({ purchaseDate: 'yesterday' }), now), null);
  assert.equal(
    m.sanitizeHolding(holdingFixture({ purchaseDate: '2027-01-01' }), now),
    null,
    'future purchase dates are rejected'
  );
  assert.equal(m.sanitizeHolding(holdingFixture({ costTotal: -1 }), now), null);
  assert.equal(m.sanitizeHolding(holdingFixture({ costCurrency: 'dirham' }), now), null);
});

// ── parsePortfolio / serializePortfolio ──────────────────────────────────────

test('parsePortfolio tolerates junk and defaults to an empty AED portfolio', async () => {
  const m = await load();
  assert.deepEqual(m.parsePortfolio(null), { version: 1, currency: 'AED', holdings: [] });
  assert.deepEqual(m.parsePortfolio('not json'), { version: 1, currency: 'AED', holdings: [] });
  assert.deepEqual(m.parsePortfolio('{"holdings":"nope"}'), {
    version: 1,
    currency: 'AED',
    holdings: [],
  });
});

test('parsePortfolio keeps valid holdings, drops malformed ones, caps the count', async () => {
  const m = await load();
  const payload = {
    version: 1,
    currency: 'sar',
    holdings: [holdingFixture(), holdingFixture({ karat: 'bad' }), holdingFixture({ id: 'h2' })],
  };
  const parsed = m.parsePortfolio(JSON.stringify(payload), { now: '2026-07-04' });
  assert.equal(parsed.currency, 'SAR');
  assert.equal(parsed.holdings.length, 2);

  const flood = {
    holdings: Array.from({ length: m.MAX_HOLDINGS + 20 }, (_, i) =>
      holdingFixture({ id: `h${i}` })
    ),
  };
  assert.equal(m.parsePortfolio(flood).holdings.length, m.MAX_HOLDINGS);
});

test('serializePortfolio round-trips through parsePortfolio', async () => {
  const m = await load();
  const original = { currency: 'AED', holdings: [m.sanitizeHolding(holdingFixture())] };
  const parsed = m.parsePortfolio(m.serializePortfolio(original));
  assert.equal(parsed.currency, 'AED');
  assert.equal(parsed.holdings.length, 1);
  assert.equal(parsed.holdings[0].weightGrams, 10);
});

// ── valueHolding ──────────────────────────────────────────────────────────────

test('valueHolding computes the reference valuation from purity and the peg', async () => {
  const m = await load();
  const holding = m.sanitizeHolding(holdingFixture());
  const value = m.valueHolding(holding, SPOT, RATES, 'AED');

  // LOCKED: 10g × (22/24) × (4000 / 31.1035) = 1178.865...
  const expectedUsd = 10 * (22 / 24) * (SPOT / TROY);
  assert.ok(Math.abs(value.currentUsd - expectedUsd) < 1e-9);
  assert.ok(Math.abs(value.currentDisplay - expectedUsd * AED_PEG) < 1e-9);
  assert.ok(Math.abs(value.fineGrams - 10 * (22 / 24)) < 1e-9);

  // Cost is AED, so gain lives in AED.
  const expectedGain = expectedUsd * AED_PEG - 4000;
  assert.ok(Math.abs(value.gainValue - expectedGain) < 1e-9);
  assert.ok(Math.abs(value.gainPct - (expectedGain / 4000) * 100) < 1e-9);
});

test('valueHolding degrades honestly when data is missing', async () => {
  const m = await load();
  const holding = m.sanitizeHolding(holdingFixture({ costCurrency: 'ZZZ' }));
  const noSpot = m.valueHolding(holding, 0, RATES, 'AED');
  assert.equal(noSpot.currentUsd, null);
  assert.equal(noSpot.gainValue, null);

  const noFx = m.valueHolding(holding, SPOT, RATES, 'AED');
  assert.ok(noFx.currentUsd != null);
  assert.equal(noFx.currentInCost, null, 'unknown cost currency → no gain figure');
  assert.equal(noFx.gainValue, null);

  const gift = m.valueHolding(
    m.sanitizeHolding(holdingFixture({ costTotal: 0 })),
    SPOT,
    RATES,
    'AED'
  );
  assert.ok(gift.gainValue != null, 'zero-cost holding still has a gain value');
  assert.equal(gift.gainPct, null, 'but no gain % against a zero cost');
});

// ── summarizePortfolio ────────────────────────────────────────────────────────

test('summarizePortfolio totals weights, values and single-currency gains', async () => {
  const m = await load();
  const holdings = [
    m.sanitizeHolding(holdingFixture()),
    m.sanitizeHolding(holdingFixture({ id: 'h2', weightGrams: 5, karat: '24', costTotal: 2200 })),
  ];
  const s = m.summarizePortfolio(holdings, SPOT, RATES, 'AED');
  assert.equal(s.count, 2);
  assert.equal(s.totalWeightGrams, 15);
  assert.ok(Math.abs(s.totalFineGrams - (10 * (22 / 24) + 5)) < 1e-3);

  const expectedUsd = (10 * (22 / 24) + 5) * (SPOT / TROY);
  assert.ok(Math.abs(s.currentUsd - expectedUsd) < 1e-6);
  assert.ok(Math.abs(s.currentDisplay - expectedUsd * AED_PEG) < 1e-6);
  assert.deepEqual(Object.keys(s.costByCurrency), ['AED']);
  assert.ok(s.gain);
  assert.ok(Math.abs(s.gain.value - (expectedUsd * AED_PEG - 6200)) < 1e-6);
});

test('summarizePortfolio withholds gain totals when any holding has no cost basis', async () => {
  const m = await load();
  const holdings = [
    m.sanitizeHolding(holdingFixture()),
    m.sanitizeHolding(holdingFixture({ id: 'h2', weightGrams: 10, karat: '24', costTotal: 0 })),
  ];
  const s = m.summarizePortfolio(holdings, SPOT, RATES, 'AED');
  assert.equal(s.hasMissingCost, true);
  assert.equal(s.gain, null, 'partial cost basis must not fabricate a portfolio-level gain');
  assert.ok(s.currentDisplay != null, 'current value still shown');
});

test('summarizePortfolio withholds gain totals for mixed cost currencies', async () => {
  const m = await load();
  const holdings = [
    m.sanitizeHolding(holdingFixture()),
    m.sanitizeHolding(holdingFixture({ id: 'h2', costCurrency: 'USD', costTotal: 1000 })),
  ];
  const s = m.summarizePortfolio(holdings, SPOT, RATES, 'AED');
  assert.equal(s.mixedCostCurrencies, true);
  assert.equal(s.gain, null, 'no fabricated cross-currency gain figure');
  assert.ok(s.currentDisplay != null, 'current value still shown');
});

test('summarizePortfolio with no spot price reports null values, not zeros', async () => {
  const m = await load();
  const s = m.summarizePortfolio([m.sanitizeHolding(holdingFixture())], 0, RATES, 'AED');
  assert.equal(s.currentUsd, null);
  assert.equal(s.currentDisplay, null);
  assert.equal(s.gain, null);
});

// ── computeTimeline ───────────────────────────────────────────────────────────

test('computeTimeline replays snapshots, only counting holdings owned on each date', async () => {
  const m = await load();
  const holdings = [
    m.sanitizeHolding(holdingFixture({ purchaseDate: '2026-01-15' })),
    m.sanitizeHolding(
      holdingFixture({ id: 'h2', weightGrams: 5, karat: '24', purchaseDate: '2026-03-01' })
    ),
  ];
  const history = [
    { date: '2026-03-02', price: 4100, rates: RATES },
    { date: '2026-02-01', price: 3900, rates: RATES },
    { date: '2026-01-01', price: 3800, rates: RATES }, // before both purchases → skipped
  ];
  const timeline = m.computeTimeline(holdings, history, 'AED');
  assert.equal(timeline.length, 2);
  assert.deepEqual(
    timeline.map((p) => p.date),
    ['2026-02-01', '2026-03-02'],
    'sorted ascending, pre-purchase snapshot dropped'
  );
  const feb = 10 * (22 / 24) * (3900 / TROY) * AED_PEG;
  const mar = (10 * (22 / 24) + 5) * (4100 / TROY) * AED_PEG;
  assert.ok(Math.abs(timeline[0].value - feb) < 1e-6);
  assert.ok(Math.abs(timeline[1].value - mar) < 1e-6);
});

test('computeTimeline returns [] when under two usable points', async () => {
  const m = await load();
  const holdings = [m.sanitizeHolding(holdingFixture())];
  assert.deepEqual(m.computeTimeline(holdings, [], 'AED'), []);
  assert.deepEqual(
    m.computeTimeline(holdings, [{ date: '2026-02-01', price: 3900, rates: {} }], 'AED'),
    []
  );
  assert.deepEqual(m.computeTimeline([], [{ date: '2026-02-01', price: 3900 }], 'AED'), []);
  // AED works even with empty snapshot rates (fixed peg).
  const twoPoints = m.computeTimeline(
    holdings,
    [
      { date: '2026-02-01', price: 3900, rates: {} },
      { date: '2026-02-02', price: 3950, rates: {} },
    ],
    'AED'
  );
  assert.equal(twoPoints.length, 2);
  // …but a floating currency with no snapshot rate is skipped, not guessed.
  assert.deepEqual(
    m.computeTimeline(
      holdings,
      [
        { date: '2026-02-01', price: 3900, rates: {} },
        { date: '2026-02-02', price: 3950, rates: {} },
      ],
      'SAR'
    ),
    []
  );
});

// ── holdingsToCsv ─────────────────────────────────────────────────────────────

test('holdingsToCsv emits a stable header and escapes user labels', async () => {
  const m = await load();
  const holdings = [
    m.sanitizeHolding(holdingFixture({ label: 'Bangle, "gift" set' })),
    m.sanitizeHolding(holdingFixture({ id: 'h2', label: 'Plain coin' })),
  ];
  const summary = m.summarizePortfolio(holdings, SPOT, RATES, 'AED');
  const csv = m.holdingsToCsv(summary.valued, 'AED');
  const lines = csv.split('\n');
  assert.equal(
    lines[0],
    'label,weight_grams,karat,purchase_date,cost_total,cost_currency,current_reference_value,value_currency'
  );
  assert.equal(lines.length, 3);
  assert.ok(lines[1].startsWith('"Bangle, ""gift"" set",10,22K,2026-01-15,4000,AED,'));
  assert.ok(lines[1].endsWith(',AED'));
  assert.ok(lines[2].startsWith('Plain coin,'));
});
