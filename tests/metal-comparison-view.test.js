'use strict';

/**
 * Phase 66 — multi-metal comparison orchestrator integration test.
 *
 * Unlike the per-module unit tests, this exercises the FULL seam: it imports the orchestrator plus all
 * four building blocks it composes (feed adapter, comparison model, freshness, render) and proves the
 * end-to-end wiring is honest —
 *   • raw feeds flow feed-adapter → comparison → freshness → render exactly as if chained by hand
 *     (html is byte-identical to composing the four public APIs directly),
 *   • gold stays byte-identical to `resolveMetalGramPrice`,
 *   • a missing / malformed feed becomes `pending-data`, never a fabricated price,
 *   • freshness uses the canonical live/cached/delayed policy and the overall badge is the stalest,
 *   • and the whole thing is dormant (html === '') while `METALS_PILOT_ENABLED` is OFF.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const VIEW = new URL('../src/lib/metal-comparison-view.js', `file://${__filename}`).href;
const ADAPTER = new URL('../src/lib/metal-feed-adapter.js', `file://${__filename}`).href;
const COMPARISON = new URL('../src/lib/metal-comparison.js', `file://${__filename}`).href;
const FRESHNESS = new URL('../src/lib/metal-freshness.js', `file://${__filename}`).href;
const RENDER = new URL('../src/lib/metal-comparison-render.js', `file://${__filename}`).href;
const PRICING = new URL('../src/lib/metal-pricing.js', `file://${__filename}`).href;
const CFG = new URL('../src/config/index.js', `file://${__filename}`).href;

const GOLD_SPOT = 4053.7;
const SILVER_SPOT = 48.2;
const OBSERVED = Date.parse('2026-07-10T00:00:00Z');

/** Gold + silver feeds in the real gold-feed shape the adapter normalizes. */
function feeds({ goldAgeMs = 2_000, silverAgeMs = 120_000, silverSpot = SILVER_SPOT } = {}) {
  return {
    gold: {
      xauUsdPerOz: GOLD_SPOT,
      timestampUtc: new Date(OBSERVED - goldAgeMs).toISOString(),
      provider: 'test-feed',
    },
    silver: {
      xagUsdPerOz: silverSpot,
      timestampUtc: new Date(OBSERVED - silverAgeMs).toISOString(),
      provider: 'test-feed',
    },
    // platinum / palladium deliberately absent → must surface as pending-data, never invented.
  };
}

test('view: pilot ON → feeds flow end-to-end into priced rows, freshness, and non-empty HTML', async () => {
  const { buildMetalComparisonView } = await import(VIEW);
  const view = buildMetalComparisonView(feeds(), {
    observedAtMs: OBSERVED,
    lang: 'en',
    pilotEnabled: true,
  });

  assert.equal(view.pilotEnabled, true);
  assert.deepEqual(view.spotByMetal, { gold: GOLD_SPOT, silver: SILVER_SPOT });

  const byKey = Object.fromEntries(view.rows.map((r) => [r.key, r]));
  assert.equal(byKey.gold.state, 'ok');
  assert.equal(byKey.silver.state, 'ok');
  assert.ok(byKey.gold.usdPerGram > 0 && byKey.silver.usdPerGram > 0);
  // Platinum/palladium have no feed → honest pending-data, never a fabricated number.
  assert.equal(byKey.platinum.state, 'pending-data');
  assert.equal(byKey.platinum.usdPerGram, null);
  assert.equal(byKey.palladium.state, 'pending-data');
  assert.equal(byKey.palladium.aedPerGram, null);

  // HTML actually rendered and carries the priced metals + framing.
  assert.match(view.html, /<table class="metal-comparison"/);
  assert.match(view.html, /Gold/);
  assert.match(view.html, /Silver/);
  assert.match(view.html, /metal-badge/); // a freshness badge for the ok rows
  assert.match(view.html, /not financial advice/i);
});

test('view: html is byte-identical to composing the four modules by hand (real seam, not a reimpl)', async () => {
  const { buildMetalComparisonView } = await import(VIEW);
  const { buildSpotByMetal, normalizeMetalFeed } = await import(ADAPTER);
  const { buildMetalComparison } = await import(COMPARISON);
  const { buildMetalFreshness } = await import(FRESHNESS);
  const { renderMetalComparisonTableHtml } = await import(RENDER);

  const raw = feeds();
  const view = buildMetalComparisonView(raw, {
    observedAtMs: OBSERVED,
    lang: 'en',
    pilotEnabled: true,
  });

  // Reproduce the exact chain the orchestrator claims to run.
  const spotByMetal = buildSpotByMetal(raw);
  const feedMeta = {};
  for (const key of ['gold', 'silver', 'platinum', 'palladium']) {
    if (!(key in raw)) continue;
    const norm = normalizeMetalFeed(key, raw[key]);
    if (norm.spotUsdPerOz != null) feedMeta[key] = { updatedAt: norm.updatedAt };
  }
  const model = buildMetalComparison(spotByMetal, { pilotEnabled: true, lang: 'en' });
  const freshnessByMetal = buildMetalFreshness(feedMeta, { observedAtMs: OBSERVED });
  const html = renderMetalComparisonTableHtml(model, { lang: 'en', freshnessByMetal });

  assert.equal(view.html, html);
  assert.deepEqual(view.spotByMetal, spotByMetal);
  assert.deepEqual(view.freshnessByMetal, freshnessByMetal);
});

test('view: gold row is byte-identical to resolveMetalGramPrice (gold never drifts through the seam)', async () => {
  const { buildMetalComparisonView } = await import(VIEW);
  const { resolveMetalGramPrice } = await import(PRICING);
  const view = buildMetalComparisonView(feeds(), { observedAtMs: OBSERVED, pilotEnabled: true });
  const gold = view.rows.find((r) => r.key === 'gold');
  const direct = resolveMetalGramPrice('gold', '24', { gold: GOLD_SPOT });
  assert.equal(gold.usdPerGram, direct.usdPerGram);
  assert.equal(gold.aedPerGram, direct.aedPerGram);
});

test('view: freshness uses the canonical policy; overall badge is the stalest metal', async () => {
  const { buildMetalComparisonView } = await import(VIEW);
  // gold 2s old → live; silver 120s old → delayed.
  const view = buildMetalComparisonView(feeds({ goldAgeMs: 2_000, silverAgeMs: 120_000 }), {
    observedAtMs: OBSERVED,
    pilotEnabled: true,
  });
  assert.equal(view.freshnessByMetal.gold.state, 'live');
  assert.equal(view.freshnessByMetal.silver.state, 'delayed');
  // No freshness fabricated for metals without a feed.
  assert.equal(view.freshnessByMetal.platinum, undefined);
  // Overall never looks fresher than the least-fresh metal it summarizes.
  assert.equal(view.overallFreshness, 'delayed');
});

test('view: a malformed feed degrades to pending-data — never a fabricated price', async () => {
  const { buildMetalComparisonView } = await import(VIEW);
  const view = buildMetalComparisonView(feeds({ silverSpot: 'not-a-number' }), {
    observedAtMs: OBSERVED,
    pilotEnabled: true,
  });
  const byKey = Object.fromEntries(view.rows.map((r) => [r.key, r]));
  assert.equal(byKey.silver.state, 'pending-data');
  assert.equal(byKey.silver.usdPerGram, null);
  assert.equal(view.spotByMetal.silver, undefined); // dropped, not invented
  assert.equal(view.freshnessByMetal.silver, undefined); // no freshness without a price
  assert.match(view.html, /Awaiting data/i);
});

test('view: without observedAtMs, freshness is empty (render shows —) but rows still price', async () => {
  const { buildMetalComparisonView } = await import(VIEW);
  const view = buildMetalComparisonView(feeds(), { pilotEnabled: true }); // no observedAtMs
  assert.deepEqual(view.freshnessByMetal, {});
  assert.equal(view.overallFreshness, 'unavailable');
  assert.equal(view.rows.find((r) => r.key === 'gold').state, 'ok');
  assert.match(view.html, /<table class="metal-comparison"/);
});

test('view: DORMANT while pilot OFF — html === "", gold still priced, non-gold disabled', async () => {
  const { buildMetalComparisonView, isMetalComparisonViewEnabled } = await import(VIEW);
  // Default flag path (METALS_PILOT_ENABLED is OFF).
  assert.equal(isMetalComparisonViewEnabled(), false);
  const view = buildMetalComparisonView(feeds(), { observedAtMs: OBSERVED }); // no pilot override
  assert.equal(view.pilotEnabled, false);
  assert.equal(view.html, ''); // nothing mounts
  const byKey = Object.fromEntries(view.rows.map((r) => [r.key, r]));
  assert.equal(byKey.gold.state, 'ok'); // gold always prices
  assert.ok(byKey.gold.usdPerGram > 0);
  for (const key of ['silver', 'platinum', 'palladium']) {
    assert.equal(byKey[key].state, 'disabled');
    assert.equal(byKey[key].usdPerGram, null);
  }
  assert.equal(isMetalComparisonViewEnabled({ pilotEnabled: true }), true);
});

test('view: Arabic seam (RTL + Arabic caption) and immutable constants', async () => {
  const { buildMetalComparisonView } = await import(VIEW);
  const { CONSTANTS } = await import(CFG);
  assert.equal(CONSTANTS.TROY_OZ_GRAMS, 31.1035);
  assert.equal(CONSTANTS.AED_PEG, 3.6725);
  const view = buildMetalComparisonView(feeds(), {
    observedAtMs: OBSERVED,
    lang: 'ar',
    pilotEnabled: true,
  });
  assert.match(view.html, /dir="rtl"/);
  assert.match(view.html, /المعادن الثمينة/); // Arabic caption
  assert.match(view.disclaimer, /نصيحة مالية/);
});
