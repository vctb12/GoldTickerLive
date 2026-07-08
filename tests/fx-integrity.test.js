'use strict';

/**
 * FX-rate integrity (Phase 52). Proves the sanitizer drops untrustworthy feed rates (so a currency
 * shows no price rather than a corrupted one) and always forces AED to the fixed peg — never letting
 * a corrupted `open.er-api.com` value reach a displayed price. Pure; no network, no clock.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const MOD = new URL('../src/lib/fx-integrity.js', `file://${__filename}`).href;
const CFG = new URL('../src/config/index.js', `file://${__filename}`).href;

test('fx: the peg constant is unchanged', async () => {
  const { CONSTANTS } = await import(CFG);
  assert.equal(CONSTANTS.AED_PEG, 3.6725);
});

test('fx: validateFxRate accepts plausible real-world rates', async () => {
  const { validateFxRate } = await import(MOD);
  for (const r of [
    0.307 /* KWD */, 0.376 /* BHD */, 3.6725 /* AED */, 83.2 /* INR */, 42000 /* IRR */,
  ]) {
    assert.equal(validateFxRate(r).ok, true, `expected ${r} to pass`);
  }
});

test('fx: validateFxRate rejects corrupted values with a reason', async () => {
  const { validateFxRate } = await import(MOD);
  assert.deepEqual(validateFxRate(0), { ok: false, reason: 'non-positive' });
  assert.deepEqual(validateFxRate(-1.5), { ok: false, reason: 'non-positive' });
  assert.deepEqual(validateFxRate(NaN), { ok: false, reason: 'not-finite' });
  assert.deepEqual(validateFxRate(Infinity), { ok: false, reason: 'not-finite' });
  assert.deepEqual(validateFxRate('abc'), { ok: false, reason: 'not-finite' });
  assert.deepEqual(validateFxRate(1e-5), { ok: false, reason: 'below-min' });
  assert.deepEqual(validateFxRate(1e8), { ok: false, reason: 'above-max' });
});

test('fx: assessAedPeg flags feed drift but never overrides the peg', async () => {
  const { assessAedPeg } = await import(MOD);
  // Exact peg agrees.
  const exact = assessAedPeg(3.6725);
  assert.equal(exact.present, true);
  assert.equal(exact.matchesPeg, true);
  assert.equal(exact.driftPct, 0);
  // A drifted feed AED is flagged (3.70 is ~0.75% off, beyond the 0.5% tolerance).
  const drift = assessAedPeg(3.7);
  assert.equal(drift.present, true);
  assert.equal(drift.matchesPeg, false);
  assert.ok(drift.driftPct > 0.5);
  assert.equal(drift.peg, 3.6725);
  // Absent / invalid feed AED → nothing to contradict.
  assert.equal(assessAedPeg(null).present, false);
  assert.equal(assessAedPeg(null).matchesPeg, true);
  assert.equal(assessAedPeg(0).present, false);
});

test('fx: sanitizeFxRates keeps valid rates and drops corrupted ones', async () => {
  const { sanitizeFxRates } = await import(MOD);
  const { safe, rejected } = sanitizeFxRates({
    EUR: 0.92,
    GBP: 0, // corrupted
    JPY: NaN, // corrupted
    INR: 83.2,
    XXX: -4, // corrupted
  });
  assert.equal(safe.EUR, 0.92);
  assert.equal(safe.INR, 83.2);
  assert.equal('GBP' in safe, false);
  assert.equal('JPY' in safe, false);
  assert.equal('XXX' in safe, false);
  const rejectedCurrencies = rejected.map((r) => r.currency).sort();
  assert.deepEqual(rejectedCurrencies, ['GBP', 'JPY', 'XXX']);
});

test('fx: sanitizeFxRates always forces AED to the fixed peg', async () => {
  const { sanitizeFxRates } = await import(MOD);
  // Feed omits AED → still pinned to the peg.
  assert.equal(sanitizeFxRates({ EUR: 0.9 }).safe.AED, 3.6725);
  // Feed carries a divergent AED → peg still wins, and the drift is recorded.
  const { safe, rejected } = sanitizeFxRates({ AED: 3.9, EUR: 0.9 });
  assert.equal(safe.AED, 3.6725); // never the feed's 3.9
  const aedReject = rejected.find((r) => r.currency === 'AED');
  assert.equal(aedReject.reason, 'aed-peg-drift');
  assert.equal(aedReject.value, 3.9);
});

test('fx: sanitizeFxRates handles null / empty input', async () => {
  const { sanitizeFxRates } = await import(MOD);
  const { safe, rejected } = sanitizeFxRates(null);
  assert.deepEqual(safe, { AED: 3.6725 });
  assert.deepEqual(rejected, []);
});

test('fx: feature flag defaults OFF (owner-gated)', async () => {
  const { isFxIntegrityEnabled } = await import(MOD);
  assert.equal(isFxIntegrityEnabled(), false);
});
