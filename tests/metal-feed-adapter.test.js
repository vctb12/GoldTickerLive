'use strict';

/**
 * Multi-metal spot-feed ingestion adapter (Phase 57, Theme B). Proves the adapter reads the same
 * feed shape the gold feed already uses, generalizes it per metal symbol, never fabricates a price
 * for a missing/malformed feed, and composes with buildMetalComparison so metals flip
 * pending-data → ok the moment their feed exists.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const MOD = new URL('../src/lib/metal-feed-adapter.js', `file://${__filename}`).href;

test('adapter: metalDataUrl follows the /data/<metal>_price.json convention', async () => {
  const { metalDataUrl } = await import(MOD);
  assert.equal(metalDataUrl('gold'), '/data/gold_price.json');
  assert.equal(metalDataUrl('silver'), '/data/silver_price.json');
  assert.equal(metalDataUrl('platinum'), '/data/platinum_price.json');
  assert.equal(metalDataUrl('palladium'), '/data/palladium_price.json');
});

test('adapter: normalizes the gold feed shape (camelCase, snake_case, envelope, legacy)', async () => {
  const { normalizeMetalFeed } = await import(MOD);
  assert.equal(normalizeMetalFeed('gold', { xauUsdPerOz: 4053.7 }).spotUsdPerOz, 4053.7);
  assert.equal(normalizeMetalFeed('gold', { xau_usd_per_oz: 4053.7 }).spotUsdPerOz, 4053.7);
  assert.equal(
    normalizeMetalFeed('gold', { ok: true, data: { xauUsdPerOz: 4053.7 } }).spotUsdPerOz,
    4053.7
  );
  assert.equal(normalizeMetalFeed('gold', { gold: { ounce_usd: 4053.7 } }).spotUsdPerOz, 4053.7);
  const g = normalizeMetalFeed('gold', {
    xauUsdPerOz: 4053.7,
    timestampUtc: '2026-07-08T12:00:00Z',
    provider: 'gold_api_com',
  });
  assert.equal(g.state, 'ok');
  assert.equal(g.updatedAt, '2026-07-08T12:00:00Z');
  assert.equal(g.source, 'gold_api_com');
});

test('adapter: generalizes to silver / platinum / palladium symbols + generic keys', async () => {
  const { normalizeMetalFeed } = await import(MOD);
  assert.equal(normalizeMetalFeed('silver', { xagUsdPerOz: 48.2 }).spotUsdPerOz, 48.2);
  assert.equal(normalizeMetalFeed('platinum', { xptUsdPerOz: 980 }).spotUsdPerOz, 980);
  assert.equal(normalizeMetalFeed('palladium', { xpdUsdPerOz: 1150 }).spotUsdPerOz, 1150);
  // Generic fallback keys also work.
  assert.equal(normalizeMetalFeed('platinum', { spotUsdPerOz: 900 }).spotUsdPerOz, 900);
  assert.equal(normalizeMetalFeed('silver', { price: 47 }).spotUsdPerOz, 47);
});

test('adapter: missing / malformed / non-positive feed → pending-data (no fabricated price)', async () => {
  const { normalizeMetalFeed } = await import(MOD);
  for (const bad of [
    null,
    undefined,
    {},
    { xauUsdPerOz: 0 },
    { xauUsdPerOz: -5 },
    { xauUsdPerOz: 'abc' },
  ]) {
    const n = normalizeMetalFeed('gold', bad);
    assert.equal(n.spotUsdPerOz, null);
    assert.equal(n.state, 'pending-data');
  }
});

test('adapter: buildSpotByMetal keeps only metals with a valid feed', async () => {
  const { buildSpotByMetal } = await import(MOD);
  const spot = buildSpotByMetal({
    gold: { xauUsdPerOz: 4053.7 },
    silver: { xagUsdPerOz: 48.2 },
    platinum: {}, // no price → omitted
    palladium: { xpdUsdPerOz: 0 }, // non-positive → omitted
  });
  assert.deepEqual(spot, { gold: 4053.7, silver: 48.2 });
});

test('adapter: output is a clean spotByMetal map (the buildMetalComparison input contract)', async () => {
  const { buildSpotByMetal } = await import(MOD);
  // The map buildMetalComparison consumes: only present, finite, positive spot numbers keyed by
  // metal. Metals without a feed are absent → the comparison shows them pending-data, never faked.
  const spot = buildSpotByMetal({ gold: { xauUsdPerOz: 4053.7 }, silver: { xagUsdPerOz: 48.2 } });
  assert.deepEqual(spot, { gold: 4053.7, silver: 48.2 });
  for (const [key, value] of Object.entries(spot)) {
    assert.equal(typeof key, 'string');
    assert.ok(Number.isFinite(value) && value > 0, `${key} must be a positive number`);
  }
  assert.equal('platinum' in spot, false);
  assert.equal('palladium' in spot, false);
});

test('adapter: buildSpotByMetal handles empty / null input', async () => {
  const { buildSpotByMetal } = await import(MOD);
  assert.deepEqual(buildSpotByMetal(), {});
  assert.deepEqual(buildSpotByMetal(null), {});
  assert.deepEqual(buildSpotByMetal({}), {});
});
