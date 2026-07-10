'use strict';

/**
 * Gold-vs-crypto current-snapshot comparison (Phase 62, Theme C). Proves the model is honest about
 * which assets have a feed (ok / pending-data / disabled), never fabricates a crypto price, converts
 * USD→AED via the fixed peg, and carries the descriptive "correlation-not-causation, not financial
 * advice" framing. Pilot OFF by default.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const MOD = new URL('../src/lib/crypto-snapshot.js', `file://${__filename}`).href;
const CFG = new URL('../src/config/index.js', `file://${__filename}`).href;

test('crypto: pilot OFF → all assets disabled (no fabricated prices)', async () => {
  const { buildCryptoSnapshot } = await import(MOD);
  const model = buildCryptoSnapshot({ btc: 68000 }, { pilotEnabled: false });
  assert.equal(model.pilotEnabled, false);
  for (const row of model.rows) {
    assert.equal(row.state, 'disabled');
    assert.equal(row.usd, null);
    assert.equal(row.aed, null);
  }
});

test('crypto: pilot ON → fed asset prices; unfed asset is pending-data', async () => {
  const { buildCryptoSnapshot } = await import(MOD);
  const model = buildCryptoSnapshot({ btc: 68000 }, { pilotEnabled: true }); // eth has no feed
  const byKey = Object.fromEntries(model.rows.map((r) => [r.key, r]));
  assert.equal(byKey.btc.state, 'ok');
  assert.ok(byKey.btc.usd > 0);
  assert.equal(byKey.eth.state, 'pending-data');
  assert.equal(byKey.eth.usd, null);
});

test('crypto: AED is USD × the fixed peg; BTC rounds to its display decimals (0)', async () => {
  const { buildCryptoSnapshot } = await import(MOD);
  const { CONSTANTS } = await import(CFG);
  const model = buildCryptoSnapshot({ btc: 68000.4 }, { pilotEnabled: true });
  const btc = model.rows.find((r) => r.key === 'btc');
  assert.equal(btc.usd, 68000); // decimals: 0
  assert.equal(btc.aed, Math.round(68000.4 * CONSTANTS.AED_PEG));
});

test('crypto: normalizeCryptoSpotMap drops non-finite / non-positive feeds', async () => {
  const { normalizeCryptoSpotMap, buildCryptoSnapshot } = await import(MOD);
  assert.deepEqual(normalizeCryptoSpotMap({ btc: 68000, eth: 0, x: -1, y: NaN, z: 'abc' }), {
    btc: 68000,
  });
  // A corrupt btc feed → pending-data, never a fabricated price.
  const model = buildCryptoSnapshot({ btc: 'bad' }, { pilotEnabled: true });
  assert.equal(model.rows.find((r) => r.key === 'btc').state, 'pending-data');
});

test('crypto: rows are primary-first (BTC) with Arabic names + descriptive framing', async () => {
  const { buildCryptoSnapshot } = await import(MOD);
  const model = buildCryptoSnapshot({ btc: 68000, eth: 3500 }, { pilotEnabled: true, lang: 'ar' });
  assert.equal(model.rows[0].key, 'btc');
  assert.equal(model.rows[0].primary, true);
  assert.equal(model.rows[0].name, 'بيتكوين');
  assert.match(model.disclaimer, /نصيحة مالية/);
});

test('crypto: descriptive framing is present (EN) — correlation not causation, not advice', async () => {
  const { buildCryptoSnapshot } = await import(MOD);
  const model = buildCryptoSnapshot({ btc: 68000 }, { pilotEnabled: true });
  assert.match(model.disclaimer, /descriptive comparison only/i);
  assert.match(model.disclaimer, /correlation is not causation/i);
  assert.match(model.disclaimer, /not financial advice/i);
});

test('crypto: isCryptoSnapshotEnabled reflects the pilot flag (default OFF)', async () => {
  const { isCryptoSnapshotEnabled } = await import(MOD);
  assert.equal(isCryptoSnapshotEnabled(), false); // CRYPTO_PILOT_ENABLED default
  assert.equal(isCryptoSnapshotEnabled({ pilotEnabled: true }), true);
});

test('crypto: constants (peg) unchanged', async () => {
  const { CONSTANTS } = await import(CFG);
  assert.equal(CONSTANTS.AED_PEG, 3.6725);
  assert.equal(CONSTANTS.TROY_OZ_GRAMS, 31.1035);
});
