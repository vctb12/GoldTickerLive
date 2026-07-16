'use strict';

/**
 * Operation Midas — Phase 8 FX-layer verification matrix.
 *
 * Locks the observable FX behavior across the ~28 configured currencies
 * (see docs/plans/midas/FX_MATRIX.md for the full per-currency matrix):
 *
 *   1. AED precedence — the 3.6725 UAE Central Bank peg wins over ANY feed
 *      value on every conversion path:
 *        a. `fetchFX()` (src/lib/api.js) deletes AED from the API payload;
 *        b. `calculateAllPrices()` (src/lib/price-calculator.js) never reads
 *           `rates.AED` — it computes AED from `CONSTANTS.AED_PEG` directly;
 *        c. `sanitizeFxRates()` (src/lib/fx-integrity.js) forces safe.AED to
 *           the peg and flags feed drift.
 *   2. Missing rate — a currency configured in countries.js but absent from
 *      the rates payload degrades to `null` in `calculateAllPrices()`, and the
 *      formatters render `null`/`NaN` as the honest em-dash placeholder '—'
 *      (never `NaN`, never `undefined` leaking into UI text).
 *   3. Corrupt rate — `sanitizeFxRates()` drops non-finite / non-positive /
 *      out-of-band values. NOTE: the sanitizer is NOT wired into the live
 *      fetch path — it is owner-gated behind `FX_INTEGRITY_ENABLED` (default
 *      OFF, src/config/feature-flags.js). These tests lock the sanitizer's
 *      contract AND the current (partial) truthiness-only guard in
 *      `calculateAllPrices()` so any silent behavior change trips a test.
 *   4. Staleness — FX older than `FX_MARKET.FX_STALE_AFTER_MS` (26 h) reports
 *      key 'stale' from `getFXFreshness()` (src/lib/live-status.js).
 *   5. Volatile currencies — EGP / LBP / TRY are configured with sane
 *      decimals (LBP must be 0), and every country carries a valid decimals
 *      config so `formatPrice` cannot receive garbage.
 */

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');

const AED_PEG = 3.6725;
const HOUR_MS = 60 * 60 * 1000;

let CONSTANTS, KARATS, COUNTRIES, api, calc, fmt, fxIntegrity, liveStatus, featureFlags;
before(async () => {
  ({ CONSTANTS } = await import('../src/config/constants.js'));
  ({ KARATS } = await import('../src/config/karats.js'));
  ({ COUNTRIES } = await import('../src/config/countries.js'));
  api = await import('../src/lib/api.js');
  calc = await import('../src/lib/price-calculator.js');
  fmt = await import('../src/lib/formatter.js');
  fxIntegrity = await import('../src/lib/fx-integrity.js');
  liveStatus = await import('../src/lib/live-status.js');
  featureFlags = await import('../src/config/feature-flags.js');
});

/** Build a fake fetch that returns the given FX payload for API_FX_URL. */
function mockFxFetch(payload) {
  return async (url) => {
    if (String(url) !== CONSTANTS.API_FX_URL) {
      throw new Error(`unexpected fetch in FX test: ${url}`);
    }
    return {
      ok: true,
      status: 200,
      json: async () => payload,
    };
  };
}

const originalFetch = globalThis.fetch;
after(() => {
  globalThis.fetch = originalFetch;
});

// ── 1. AED precedence — the peg wins on every path ──────────────────────────

test('fx: fetchFX() strips AED from the feed so the API can never carry a peg override', async () => {
  globalThis.fetch = mockFxFetch({
    rates: { AED: 9.99, SAR: 3.75, EGP: 48.1, TRY: 33.2, LBP: 89500 },
    time_last_update_utc: 'Wed, 15 Jul 2026 00:02:31 +0000',
    time_next_update_utc: 'Thu, 16 Jul 2026 00:02:31 +0000',
  });
  try {
    const fx = await api.fetchFX();
    assert.strictEqual(fx.source, 'live');
    assert.ok(!('AED' in fx.rates), 'AED must be deleted from the live rates payload');
    assert.strictEqual(fx.rates.SAR, 3.75, 'other rates pass through unchanged');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('fx: calculateAllPrices() prices AED from the exact 3.6725 peg even when rates carry a hostile AED', () => {
  const spot = 4000;
  // Hostile payload: AED present at a wrong rate. calculateAllPrices must not read it.
  const rates = { AED: 9.99, SAR: 3.75 };
  const countries = COUNTRIES.filter((c) => ['AED', 'SAR'].includes(c.currency));
  const prices = calc.calculateAllPrices(spot, rates, KARATS, countries);
  for (const karat of KARATS) {
    const expectedGram = (spot / CONSTANTS.TROY_OZ_GRAMS) * karat.purity * AED_PEG;
    const expectedOz = spot * karat.purity * AED_PEG;
    assert.strictEqual(
      prices[karat.code].AED.gram,
      expectedGram,
      `${karat.code}K AED/gram must come from the peg, not the feed`
    );
    assert.strictEqual(prices[karat.code].AED.oz, expectedOz, `${karat.code}K AED/oz from the peg`);
  }
});

test('fx: sanitizeFxRates() always forces AED to exactly 3.6725 and flags feed drift', () => {
  const { safe, rejected } = fxIntegrity.sanitizeFxRates({ AED: 4.5, SAR: 3.75 });
  assert.strictEqual(safe.AED, AED_PEG);
  assert.ok(rejected.some((r) => r.currency === 'AED' && r.reason === 'aed-peg-drift'));
  // Even with no feed at all, AED resolves to the peg (peg is policy, not data).
  assert.strictEqual(fxIntegrity.sanitizeFxRates(null).safe.AED, AED_PEG);
});

test('fx: the UAE country entry is the only fixedPeg currency', () => {
  const pegged = COUNTRIES.filter((c) => c.fixedPeg === true);
  assert.strictEqual(pegged.length, 1, 'exactly one fixed-peg country');
  assert.strictEqual(pegged[0].currency, 'AED');
});

// ── 2. Missing rate — defined degraded state, honest placeholder ────────────

test('fx: a configured currency missing from the rates payload degrades to null, not NaN/undefined', () => {
  const spot = 4000;
  // EGP configured in countries.js, absent from this payload.
  const rates = { SAR: 3.75 };
  const countries = COUNTRIES.filter((c) => ['EGP', 'SAR'].includes(c.currency));
  const prices = calc.calculateAllPrices(spot, rates, KARATS, countries);
  for (const karat of KARATS) {
    assert.strictEqual(
      prices[karat.code].EGP,
      null,
      `${karat.code}K EGP must be exactly null when the rate is missing`
    );
    const sar = prices[karat.code].SAR;
    assert.ok(Number.isFinite(sar.gram) && sar.gram > 0, 'present rates still price normally');
  }
});

test('fx: every configured currency missing from an empty payload degrades to null across the board', () => {
  const prices = calc.calculateAllPrices(4000, {}, KARATS, COUNTRIES);
  for (const country of COUNTRIES) {
    if (country.currency === 'AED' || country.currency === 'USD') continue; // computed, not feed
    assert.strictEqual(
      prices['24'][country.currency],
      null,
      `${country.currency} degrades to null`
    );
  }
  // USD and AED never depend on the feed.
  assert.ok(prices['24'].USD.gram > 0, 'USD is the base currency — always priced');
  assert.ok(prices['24'].AED.gram > 0, 'AED comes from the peg — always priced');
});

test('fx: formatters render the degraded null/NaN state as the em-dash placeholder, never NaN text', () => {
  assert.strictEqual(fmt.formatPrice(null, 'EGP', 2), '—');
  assert.strictEqual(fmt.formatPrice(undefined, 'EGP', 2), '—');
  assert.strictEqual(fmt.formatPrice(NaN, 'EGP', 2), '—');
  assert.strictEqual(fmt.formatCurrency(null, 'EGP', 'en', 2), '—');
  assert.strictEqual(fmt.formatCurrency(NaN, 'LBP', 'ar', 0), '—');
  // localPrice() propagates the degraded state instead of inventing a number.
  assert.strictEqual(calc.localPrice(100, undefined), null);
  assert.strictEqual(calc.localPrice(100, null), null);
  assert.strictEqual(calc.localPrice(null, 3.75), null);
});

// ── 3. Corrupt rate — sanitizer contract + current partial guard ────────────

test('fx: sanitizeFxRates() drops zero, negative, NaN, non-numeric-string, and absurd rates', () => {
  const { safe, rejected } = fxIntegrity.sanitizeFxRates({
    SAR: 0,
    EGP: -48,
    TRY: NaN,
    LBP: 'not-a-number',
    JOD: 1e9, // above FX_RATE_MAX (1e7) — decimal-place / percentage defect
    KWD: 0.31, // sane — must survive
    IQD: '1310.5', // numeric string — coerced, sane
  });
  for (const bad of ['SAR', 'EGP', 'TRY', 'LBP', 'JOD']) {
    assert.ok(!(bad in safe), `${bad} must be dropped from safe rates`);
    assert.ok(
      rejected.some((r) => r.currency === bad),
      `${bad} must be recorded as rejected`
    );
  }
  assert.strictEqual(safe.KWD, 0.31, 'sane rate survives');
  assert.strictEqual(safe.IQD, 1310.5, 'numeric string is coerced to a number');
});

test('fx: validateFxRate() reasons are stable for each corruption class', () => {
  assert.strictEqual(fxIntegrity.validateFxRate(NaN).reason, 'not-finite');
  assert.strictEqual(fxIntegrity.validateFxRate('garbage').reason, 'not-finite');
  assert.strictEqual(fxIntegrity.validateFxRate(0).reason, 'non-positive');
  assert.strictEqual(fxIntegrity.validateFxRate(-3.75).reason, 'non-positive');
  assert.strictEqual(fxIntegrity.validateFxRate(1e-9).reason, 'below-min');
  assert.strictEqual(fxIntegrity.validateFxRate(1e9).reason, 'above-max');
  assert.strictEqual(fxIntegrity.validateFxRate(3.6725).reason, 'ok');
});

test('fx: GAP LOCK — sanitizer is owner-gated OFF and NOT wired into the live fetch path', () => {
  // Documents the current state (see docs/plans/midas/FX_MATRIX.md §gap):
  // fetchFX() → calculateAllPrices() applies raw feed rates behind a
  // truthiness check only. FX_INTEGRITY_ENABLED is the owner-gated switch.
  assert.strictEqual(featureFlags.FEATURE_FLAGS.FX_INTEGRITY_ENABLED, false);
  assert.strictEqual(fxIntegrity.isFxIntegrityEnabled(), false);

  const spot = 4000;
  const countries = COUNTRIES.filter((c) => ['SAR', 'EGP', 'TRY', 'JOD'].includes(c.currency));
  const prices = calc.calculateAllPrices(
    spot,
    { SAR: 0, EGP: NaN, TRY: -33, JOD: 1e9 },
    KARATS,
    countries
  );
  // Falsy corrupt values (0, NaN) already degrade to null via the truthiness check.
  assert.strictEqual(prices['24'].SAR, null, 'rate 0 degrades to null (truthiness guard)');
  assert.strictEqual(prices['24'].EGP, null, 'rate NaN degrades to null (truthiness guard)');
  // Truthy corrupt values flow through UNTIL the sanitizer is wired (owner-gated).
  // If either assertion below starts failing, the guard changed — update
  // docs/plans/midas/FX_MATRIX.md and this lock in the same commit.
  assert.ok(prices['24'].TRY.gram < 0, 'negative rate currently flows through (known gap)');
  assert.ok(prices['24'].JOD.gram > 1e9, 'absurd rate currently flows through (known gap)');
});

// ── 4. Staleness — 26 h threshold via live-status.js ─────────────────────────

test('fx: FX_STALE_AFTER_MS is exactly 26 hours', () => {
  assert.strictEqual(liveStatus.FX_MARKET.FX_STALE_AFTER_MS, 26 * HOUR_MS);
});

test('fx: getFXFreshness() reports stale for FX older than 26 h and live within it', () => {
  const now = Date.now();
  const stale = liveStatus.getFXFreshness({ fxUpdatedAt: new Date(now - 27 * HOUR_MS) });
  assert.strictEqual(stale.key, 'stale');

  const fresh = liveStatus.getFXFreshness({ fxUpdatedAt: new Date(now - 25 * HOUR_MS) });
  assert.strictEqual(fresh.key, 'live');

  // Cache-served but still inside the window: 'cached', never 'live'.
  const cached = liveStatus.getFXFreshness({
    fxUpdatedAt: new Date(now - 2 * HOUR_MS),
    hasCacheFailure: true,
  });
  assert.strictEqual(cached.key, 'cached');

  // Stale beats the cached label — honesty degrades, never upgrades.
  const staleCached = liveStatus.getFXFreshness({
    fxUpdatedAt: new Date(now - 30 * HOUR_MS),
    hasCacheFailure: true,
  });
  assert.strictEqual(staleCached.key, 'stale');

  // No timestamp at all: 'unavailable', with the honest '—' placeholders.
  const unavailable = liveStatus.getFXFreshness({});
  assert.strictEqual(unavailable.key, 'unavailable');
  assert.strictEqual(unavailable.ageText, '—');
});

// ── 5. Volatile currencies + decimals config sanity ─────────────────────────

test('fx: EGP, LBP, TRY are configured, and LBP uses 0 decimals', () => {
  const byCurrency = new Map(COUNTRIES.map((c) => [c.currency, c]));
  for (const code of ['EGP', 'LBP', 'TRY']) {
    assert.ok(byCurrency.has(code), `${code} present in countries.js`);
  }
  assert.strictEqual(byCurrency.get('LBP').decimals, 0, 'LBP must display 0 decimals');
  assert.strictEqual(byCurrency.get('EGP').decimals, 2);
  assert.strictEqual(byCurrency.get('TRY').decimals, 2);
});

test('fx: every country has a sane decimals config (integer 0–3) and a 3-letter currency code', () => {
  assert.ok(COUNTRIES.length >= 25, 'country roster present');
  for (const country of COUNTRIES) {
    assert.ok(
      Number.isInteger(country.decimals) && country.decimals >= 0 && country.decimals <= 3,
      `${country.code}: decimals ${country.decimals} must be an integer 0–3`
    );
    assert.match(
      country.currency,
      /^[A-Z]{3}$/,
      `${country.code}: currency ${country.currency} must be a 3-letter ISO code`
    );
  }
});

test('fx: high-denomination currencies use 0 decimals so prices never render fractional pounds/rials', () => {
  const byCurrency = new Map(COUNTRIES.map((c) => [c.currency, c]));
  for (const code of ['LBP', 'IQD', 'SYP', 'YER', 'SOS', 'DJF', 'KMF', 'PKR']) {
    assert.strictEqual(byCurrency.get(code)?.decimals, 0, `${code} must use 0 decimals`);
  }
});
