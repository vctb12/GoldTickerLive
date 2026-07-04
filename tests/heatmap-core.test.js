'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

// heatmap-core is an ES module; load it dynamically inside an async helper.
let core;
async function load() {
  if (!core) core = await import('../src/pages/heatmap/heatmap-core.js');
  return core;
}

const COUNTRIES = [
  {
    code: 'AE',
    slug: 'uae',
    nameEn: 'United Arab Emirates',
    nameAr: 'الإمارات',
    currency: 'AED',
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
    decimals: 2,
    group: 'gcc',
  },
  {
    code: 'KW',
    slug: 'kuwait',
    nameEn: 'Kuwait',
    nameAr: 'الكويت',
    currency: 'KWD',
    decimals: 3,
    group: 'gcc',
  },
  {
    code: 'XX',
    slug: 'nowhere',
    nameEn: 'Nowhere',
    nameAr: 'لا مكان',
    currency: 'ZZZ',
    decimals: 2,
    group: 'other',
  },
];

const INTEL = {
  AE: { vatRate: 0.05, makingChargeMin: 0.08, makingChargeMax: 0.3 },
  SA: { vatRate: 0.15, makingChargeMin: 0.1, makingChargeMax: 0.35 },
  KW: { vatRate: 0, makingChargeMin: 0.08, makingChargeMax: 0.28 },
  XX: { vatRate: 0.1, makingChargeMin: 0.1, makingChargeMax: 0.2 },
};

const RATES = { SAR: 3.75, KWD: 0.31 }; // ZZZ intentionally missing
const SPOT = 4000; // XAU/USD per troy oz — clean number for hand-checkable math

function rowsFixture(coreModule, karat = '24') {
  return coreModule.buildHeatmapRows({
    spotUsdPerOz: SPOT,
    rates: RATES,
    countries: COUNTRIES,
    karat,
    getIntel: (code) => INTEL[code],
  });
}

// ── buildHeatmapRows ──────────────────────────────────────────────────────────

test('buildHeatmapRows reuses the compare retail-estimate math and annotates pctVsUae', async () => {
  const m = await load();
  const rows = rowsFixture(m);

  // LOCKED reference math (24K): usd/gram = 4000 / 31.1035 = 128.60356...
  const usdPerGram = SPOT / 31.1035;
  const ae = rows.find((r) => r.code === 'AE');
  const expectedAe = usdPerGram * (1 + (0.08 + 0.3) / 2) * 1.05;
  assert.ok(Math.abs(ae.retailUsdPerGram - expectedAe) < 1e-9);
  assert.equal(ae.pctVsUae, 0);

  const sa = rows.find((r) => r.code === 'SA');
  const expectedSa = usdPerGram * (1 + (0.1 + 0.35) / 2) * 1.15;
  assert.ok(Math.abs(sa.retailUsdPerGram - expectedSa) < 1e-9);
  assert.ok(sa.pctVsUae > 0);

  // Country with no FX rate is present but unavailable.
  const xx = rows.find((r) => r.code === 'XX');
  assert.equal(xx.available, false);
  assert.equal(xx.retailUsdPerGram, null);
});

// ── computeDomain ─────────────────────────────────────────────────────────────

test('computeDomain builds 4 equal-interval thresholds over available values', async () => {
  const m = await load();
  const rows = rowsFixture(m);
  const domain = m.computeDomain(rows);
  assert.ok(domain);
  const values = rows.filter((r) => r.retailUsdPerGram != null).map((r) => r.retailUsdPerGram);
  assert.equal(domain.min, Math.min(...values));
  assert.equal(domain.max, Math.max(...values));
  assert.equal(domain.thresholds.length, m.HEATMAP_BUCKETS - 1);
  const step = (domain.max - domain.min) / m.HEATMAP_BUCKETS;
  assert.ok(Math.abs(domain.thresholds[0] - (domain.min + step)) < 1e-9);
});

test('computeDomain returns null with fewer than two available values or a flat range', async () => {
  const m = await load();
  assert.equal(m.computeDomain([]), null);
  assert.equal(m.computeDomain([{ retailUsdPerGram: 90 }]), null);
  assert.equal(
    m.computeDomain([{ retailUsdPerGram: 90 }, { retailUsdPerGram: 90 }]),
    null,
    'min === max has no meaningful scale'
  );
  assert.equal(m.computeDomain([{ retailUsdPerGram: null }, { retailUsdPerGram: null }]), null);
});

// ── bucketFor ─────────────────────────────────────────────────────────────────

test('bucketFor maps min→0, max→top bucket, and nulls to null', async () => {
  const m = await load();
  const domain = { min: 100, max: 200, thresholds: [120, 140, 160, 180] };
  assert.equal(m.bucketFor(100, domain), 0);
  assert.equal(m.bucketFor(119.99, domain), 0);
  assert.equal(m.bucketFor(120, domain), 1);
  assert.equal(m.bucketFor(159.99, domain), 2);
  assert.equal(m.bucketFor(180, domain), 4);
  assert.equal(m.bucketFor(200, domain), 4, 'max clamps into the top bucket');
  assert.equal(m.bucketFor(999, domain), 4, 'values beyond max clamp');
  assert.equal(m.bucketFor(null, domain), null);
  assert.equal(m.bucketFor(150, null), null);
});

// ── legendStops ───────────────────────────────────────────────────────────────

test('legendStops produces 5 contiguous ranges with theme fills', async () => {
  const m = await load();
  const domain = { min: 100, max: 200, thresholds: [120, 140, 160, 180] };
  const light = m.legendStops(domain, 'light');
  assert.equal(light.length, 5);
  assert.equal(light[0].from, 100);
  assert.equal(light[4].to, 200);
  for (let i = 1; i < light.length; i++) {
    assert.equal(light[i].from, light[i - 1].to, 'ranges are contiguous');
  }
  assert.deepEqual(
    light.map((s) => s.color),
    m.HEATMAP_RAMPS.light
  );
  const dark = m.legendStops(domain, 'dark');
  assert.deepEqual(
    dark.map((s) => s.color),
    m.HEATMAP_RAMPS.dark
  );
  assert.deepEqual(m.legendStops(null), []);
});

test('heatmap ramps have 5 steps per theme (one per bucket)', async () => {
  const m = await load();
  assert.equal(m.HEATMAP_RAMPS.light.length, m.HEATMAP_BUCKETS);
  assert.equal(m.HEATMAP_RAMPS.dark.length, m.HEATMAP_BUCKETS);
  for (const hex of [...m.HEATMAP_RAMPS.light, ...m.HEATMAP_RAMPS.dark]) {
    assert.match(hex, /^#[0-9a-f]{6}$/);
  }
});

// ── fillIndex ─────────────────────────────────────────────────────────────────

test('fillIndex maps every row code to a bucket (null when unavailable)', async () => {
  const m = await load();
  const rows = rowsFixture(m);
  const domain = m.computeDomain(rows);
  const index = m.fillIndex(rows, domain);
  assert.equal(index.size, COUNTRIES.length);
  assert.equal(typeof index.get('AE').bucket, 'number');
  assert.equal(index.get('XX').bucket, null, 'no FX rate → no bucket');
  // Cheapest available row lands in bucket 0, priciest in the top bucket.
  const available = rows.filter((r) => r.retailUsdPerGram != null);
  const cheapest = available.reduce((a, b) => (a.retailUsdPerGram < b.retailUsdPerGram ? a : b));
  const priciest = available.reduce((a, b) => (a.retailUsdPerGram > b.retailUsdPerGram ? a : b));
  assert.equal(index.get(cheapest.code).bucket, 0);
  assert.equal(index.get(priciest.code).bucket, m.HEATMAP_BUCKETS - 1);
});

// ── hash round-trip ───────────────────────────────────────────────────────────

test('parseHeatmapHash falls back to defaults on junk input', async () => {
  const m = await load();
  const valid = new Set(['AE', 'SA', 'EG']);
  assert.deepEqual(m.parseHeatmapHash('', valid), { karat: '22', selected: null });
  assert.deepEqual(m.parseHeatmapHash('#k=99&c=zz', valid), { karat: '22', selected: null });
  assert.deepEqual(m.parseHeatmapHash('#k=18&c=eg', valid), { karat: '18', selected: 'EG' });
  assert.deepEqual(m.parseHeatmapHash('#k=24', valid), { karat: '24', selected: null });
});

test('serializeHeatmapHash round-trips through parseHeatmapHash', async () => {
  const m = await load();
  const valid = new Set(['AE', 'SA', 'EG']);
  const hash = m.serializeHeatmapHash({ karat: '21', selected: 'SA' });
  assert.equal(hash, 'k=21&c=sa');
  assert.deepEqual(m.parseHeatmapHash(`#${hash}`, valid), { karat: '21', selected: 'SA' });
  assert.equal(m.serializeHeatmapHash({ karat: '22' }), 'k=22');
  assert.equal(m.serializeHeatmapHash({ karat: 'bogus', selected: null }), 'k=22');
});

// ── generated map data sanity ─────────────────────────────────────────────────

test('world-map-data covers every tracked country exactly once (polygon or marker)', async () => {
  const data = await import('../src/pages/heatmap/world-map-data.js');
  const { COUNTRIES: SITE_COUNTRIES } = await import('../src/config/countries.js');
  const shapeCodes = new Set(data.WORLD_COUNTRIES.map((c) => c.code));
  const markerCodes = new Set(data.WORLD_MARKERS.map((c) => c.code));
  for (const country of SITE_COUNTRIES) {
    const inShapes = shapeCodes.has(country.code);
    const inMarkers = markerCodes.has(country.code);
    assert.ok(
      inShapes || inMarkers,
      `${country.code} must be drawable on the map (polygon or marker)`
    );
    assert.ok(!(inShapes && inMarkers), `${country.code} must not be drawn twice`);
  }
  assert.match(data.WORLD_VIEWBOX, /^0 0 \d+ \d+$/);
  assert.ok(data.WORLD_BACKGROUND.length > 1000, 'background landmass path present');
  for (const shape of data.WORLD_COUNTRIES) {
    assert.match(shape.d, /^M/, `${shape.code} path starts with a moveto`);
    assert.ok(shape.d.endsWith('Z'), `${shape.code} path is closed`);
  }
});
