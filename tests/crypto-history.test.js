'use strict';

/**
 * Crypto price-history plumbing — proves the normaliser produces records the existing gold history
 * pipeline (`toChartData` / `filterByRange`) consumes unchanged, and that the pilot ships OFF.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const ASSETS = new URL('../src/config/crypto-assets.js', `file://${__filename}`).href;
const CRYPTO = new URL('../src/lib/crypto-history.js', `file://${__filename}`).href;
const HIST = new URL('../src/lib/historical-data.js', `file://${__filename}`).href;

test('crypto: pilot ships OFF', async () => {
  const { CRYPTO_PILOT_ENABLED } = await import(ASSETS);
  assert.equal(CRYPTO_PILOT_ENABLED, false);
});

test('crypto: registry has BTC (primary) and ETH with pair symbols', async () => {
  const { CRYPTO_ASSETS, PRIMARY_CRYPTO, cryptoKeys } = await import(ASSETS);
  assert.equal(PRIMARY_CRYPTO, 'btc');
  assert.equal(CRYPTO_ASSETS.btc.symbol, 'BTC/USD');
  assert.equal(CRYPTO_ASSETS.eth.symbol, 'ETH/USD');
  assert.equal(CRYPTO_ASSETS.btc.primary, true);
  assert.deepEqual(cryptoKeys(), ['btc', 'eth']);
});

test('crypto: normalizeCryptoPoint rejects junk, accepts valid points', async () => {
  const { normalizeCryptoPoint } = await import(CRYPTO);
  assert.equal(normalizeCryptoPoint(null, 'btc'), null);
  assert.equal(normalizeCryptoPoint({ date: '2026-01-01', price: 0 }, 'btc'), null);
  assert.equal(normalizeCryptoPoint({ date: 'nope', price: 5 }, 'btc'), null);
  assert.equal(normalizeCryptoPoint({ date: '2026-01-01', price: 5 }, 'unknown'), null);
  const ok = normalizeCryptoPoint({ date: '2026-01-01', close: 42000 }, 'btc');
  assert.deepEqual(ok, {
    date: '2026-01-01',
    price: 42000,
    granularity: 'daily',
    source: 'crypto-feed',
    asset: 'btc',
  });
});

test('crypto: normalizeCryptoHistory sorts, de-dupes, and drops bad points', async () => {
  const { normalizeCryptoHistory } = await import(CRYPTO);
  const recs = normalizeCryptoHistory(
    [
      { date: '2026-03-01', price: 60000 },
      { date: '2026-01-01', price: 42000 },
      { date: '2026-01-01', price: 43000 }, // dup date → last wins
      { date: 'bad', price: 1 },
      { date: '2026-02-01', price: -1 }, // non-positive → dropped
    ],
    'btc'
  );
  assert.deepEqual(
    recs.map((r) => [r.date, r.price]),
    [
      ['2026-01-01', 43000],
      ['2026-03-01', 60000],
    ]
  );
});

test('crypto: normalized records flow through the gold history pipeline unchanged', async () => {
  const { normalizeCryptoHistory } = await import(CRYPTO);
  const { toChartData } = await import(HIST);
  const recs = normalizeCryptoHistory(
    [
      { date: '2026-01-01', price: 42000 },
      { date: '2026-02-01', price: 50000 },
    ],
    'btc'
  );
  // toChartData is asset-generic ({date,price} -> {time,value}); crypto records must just work.
  assert.deepEqual(toChartData(recs), [
    { time: '2026-01-01', value: 42000 },
    { time: '2026-02-01', value: 50000 },
  ]);
});
