'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

// Liveness substrate — pure animation logic + the event contract documented at
// the top of src/lib/animation.js. These tests lock the count-up tween
// (reduced-motion + cancellation), direction detection, and — critically — the
// freshness honesty TRUST RULE: a cached/fallback/estimated value must never be
// signalled as a live tick (direction === 'unchanged').

async function load() {
  const url = new URL('file://' + path.resolve(__dirname, '..', 'src', 'lib', 'animation.js'));
  return import(url.href);
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const NOOP_TARGET = { dispatchEvent: () => true };

// ── animateValue ─────────────────────────────────────────────────────────────

test('animateValue: tweens from→to and completes with the final value', async () => {
  const { animateValue } = await load();
  const updates = [];
  let final = null;

  await new Promise((resolve, reject) => {
    const guard = setTimeout(() => reject(new Error('animation did not complete')), 2000);
    animateValue({
      from: 0,
      to: 100,
      duration: 60,
      decimals: 0,
      onUpdate: (v) => updates.push(v),
      onComplete: (v) => {
        clearTimeout(guard);
        final = v;
        resolve();
      },
    });
  });

  assert.equal(final, 100);
  assert.ok(updates.length >= 1, 'should emit at least one intermediate frame');
  assert.ok(
    updates.every((v) => v >= 0 && v <= 100),
    'every emitted value stays within [from, to]'
  );
});

test('animateValue: returns a cancellable handle — no callbacks after cancel', async () => {
  const { animateValue } = await load();
  let updates = 0;
  let completed = false;

  const handle = animateValue({
    from: 0,
    to: 100,
    duration: 300,
    onUpdate: () => {
      updates += 1;
    },
    onComplete: () => {
      completed = true;
    },
  });
  assert.equal(typeof handle.id, 'number');
  assert.equal(typeof handle.cancel, 'function');

  handle.cancel();
  assert.equal(handle.cancelled, true);

  await delay(120);
  assert.equal(updates, 0, 'cancelled before first frame → no onUpdate');
  assert.equal(completed, false, 'cancelled animation never completes');
});

test('animateValue: respects prefers-reduced-motion — jumps straight to `to`', async () => {
  const { animateValue } = await load();
  const previousWindow = global.window;
  global.window = { matchMedia: (q) => ({ matches: String(q).includes('reduce') }) };
  try {
    const updates = [];
    let final = null;
    const handle = animateValue({
      from: 0,
      to: 42,
      duration: 1000,
      decimals: 2,
      onUpdate: (v) => updates.push(v),
      onComplete: (v) => {
        final = v;
      },
    });
    // Reduced motion resolves synchronously — no frames scheduled.
    assert.deepEqual(updates, [42], 'onUpdate called exactly once with the final value');
    assert.equal(final, 42);
    assert.equal(handle.finished, true);
  } finally {
    if (previousWindow === undefined) delete global.window;
    else global.window = previousWindow;
  }
});

test('animateValue: zero distance jumps without animating', async () => {
  const { animateValue } = await load();
  const updates = [];
  let completed = false;
  animateValue({
    from: 50,
    to: 50,
    duration: 500,
    onUpdate: (v) => updates.push(v),
    onComplete: () => {
      completed = true;
    },
  });
  assert.deepEqual(updates, [50]);
  assert.equal(completed, true);
});

test('animateValue: non-finite `to` is a no-op (already-cancelled handle)', async () => {
  const { animateValue } = await load();
  let called = false;
  const handle = animateValue({
    from: 0,
    to: NaN,
    onUpdate: () => {
      called = true;
    },
    onComplete: () => {
      called = true;
    },
  });
  assert.equal(handle.cancelled, true);
  assert.equal(called, false);
});

test('animateValue: non-finite `from` jumps straight to `to`', async () => {
  const { animateValue } = await load();
  const updates = [];
  animateValue({ from: undefined, to: 7, duration: 500, onUpdate: (v) => updates.push(v) });
  assert.deepEqual(updates, [7]);
});

test('animateValue: decimals rounds the emitted value', async () => {
  const { animateValue } = await load();
  let value = null;
  animateValue({ from: 1, to: 1, decimals: 2, onUpdate: (v) => (value = v) });
  // jump path (from === to) still applies decimals
  assert.equal(value, 1);

  let jumped = null;
  // reduced-motion forces the jump path so we can assert rounding deterministically
  const previousWindow = global.window;
  global.window = { matchMedia: () => ({ matches: true }) };
  try {
    animateValue({ from: 0, to: 3.14159, decimals: 2, onUpdate: (v) => (jumped = v) });
  } finally {
    if (previousWindow === undefined) delete global.window;
    else global.window = previousWindow;
  }
  assert.equal(jumped, 3.14);
});

// ── getPriceDirection ────────────────────────────────────────────────────────

test('getPriceDirection: up / down / unchanged', async () => {
  const { getPriceDirection } = await load();
  assert.equal(getPriceDirection(100, 110), 'up');
  assert.equal(getPriceDirection(110, 100), 'down');
  assert.equal(getPriceDirection(100, 100), 'unchanged');
});

test('getPriceDirection: non-finite inputs are unchanged (never default up)', async () => {
  const { getPriceDirection } = await load();
  assert.equal(getPriceDirection(NaN, 100), 'unchanged');
  assert.equal(getPriceDirection(100, NaN), 'unchanged');
  assert.equal(getPriceDirection(null, 100), 'unchanged');
  assert.equal(getPriceDirection(100, undefined), 'unchanged');
  assert.equal(getPriceDirection(100, Infinity), 'unchanged');
});

test('getPriceDirection: epsilon band treats sub-threshold moves as unchanged', async () => {
  const { getPriceDirection } = await load();
  assert.equal(getPriceDirection(100, 100.004, 0.01), 'unchanged');
  assert.equal(getPriceDirection(100, 100.02, 0.01), 'up');
});

// ── Freshness vocabulary ─────────────────────────────────────────────────────

test('isLiveFreshness: only "live" is live; objects normalise via .state/.key', async () => {
  const { isLiveFreshness, normalizeFreshnessKey } = await load();
  assert.equal(isLiveFreshness('live'), true);
  assert.equal(isLiveFreshness({ state: 'live' }), true);
  assert.equal(isLiveFreshness({ key: 'live' }), true);
  for (const s of [
    'cached',
    'delayed',
    'estimated',
    'fallback',
    'stale',
    'closed',
    'unavailable',
  ]) {
    assert.equal(isLiveFreshness(s), false, `${s} is not live`);
  }
  assert.equal(normalizeFreshnessKey(null), 'unavailable');
  assert.equal(normalizeFreshnessKey(undefined), 'unavailable');
  assert.equal(normalizeFreshnessKey('cached'), 'cached');
});

// ── Emit helpers + TRUST RULE ────────────────────────────────────────────────

test('emitGoldPriceUpdate: a genuine live tick carries the real direction', async () => {
  const { emitGoldPriceUpdate, LIVENESS_EVENTS } = await load();
  let captured = null;
  const target = {
    dispatchEvent: (e) => {
      captured = e;
      return true;
    },
  };
  const detail = emitGoldPriceUpdate(
    { previous: 100, current: 110, freshness: 'live', timestamp: '2026-06-29T00:00:00Z' },
    target
  );
  assert.equal(detail.direction, 'up');
  assert.equal(detail.freshness, 'live');
  assert.equal(detail.previous, 100);
  assert.equal(detail.current, 110);
  assert.equal(detail.timestamp, '2026-06-29T00:00:00Z');
  assert.equal(captured.type, LIVENESS_EVENTS.GOLD_UPDATE);
  assert.deepEqual(captured.detail, detail);
});

test('TRUST RULE: cached/fallback/estimated/stale/delayed/closed never flash', async () => {
  const { emitGoldPriceUpdate } = await load();
  for (const state of [
    'cached',
    'fallback',
    'estimated',
    'stale',
    'delayed',
    'closed',
    'unavailable',
  ]) {
    const detail = emitGoldPriceUpdate(
      // a real +10 up-move, but the value is NOT live …
      { previous: 100, current: 110, freshness: state },
      NOOP_TARGET
    );
    assert.equal(detail.direction, 'unchanged', `${state} must be reported as unchanged`);
    assert.equal(detail.freshness, state, `${state} freshness is carried through honestly`);
  }
});

test('emitGoldPriceUpdate: first arrival (previous null) is unchanged even when live', async () => {
  const { emitGoldPriceUpdate } = await load();
  const detail = emitGoldPriceUpdate(
    { previous: null, current: 110, freshness: 'live' },
    NOOP_TARGET
  );
  assert.equal(detail.direction, 'unchanged');
  assert.equal(detail.previous, null);
});

test('emitGoldPriceUpdate: live down-move reports down', async () => {
  const { emitGoldPriceUpdate } = await load();
  const detail = emitGoldPriceUpdate(
    { previous: 110, current: 100, freshness: 'live' },
    NOOP_TARGET
  );
  assert.equal(detail.direction, 'down');
});

test('emitFxUpdate: a rates-map refresh is unchanged; a live single rate moves', async () => {
  const { emitFxUpdate } = await load();
  const mapDetail = emitFxUpdate(
    { previous: { USD: 1 }, current: { USD: 1, SAR: 3.75 }, freshness: 'live' },
    NOOP_TARGET
  );
  assert.equal(mapDetail.direction, 'unchanged', 'a whole rates map has no single direction');

  const rateDetail = emitFxUpdate(
    { previous: 3.74, current: 3.75, freshness: 'live' },
    NOOP_TARGET
  );
  assert.equal(rateDetail.direction, 'up');

  const cachedRate = emitFxUpdate(
    { previous: 3.74, current: 3.75, freshness: 'cached' },
    NOOP_TARGET
  );
  assert.equal(cachedRate.direction, 'unchanged', 'cached FX must not flash');
});

test('emitFreshnessChange: detail carries previous, current, kind (normalised)', async () => {
  const { emitFreshnessChange, LIVENESS_EVENTS } = await load();
  let captured = null;
  const target = {
    dispatchEvent: (e) => {
      captured = e;
      return true;
    },
  };
  const detail = emitFreshnessChange(
    { previous: 'live', current: { key: 'cached' }, kind: 'gold' },
    target
  );
  assert.equal(detail.previous, 'live');
  assert.equal(detail.current, 'cached');
  assert.equal(detail.kind, 'gold');
  assert.equal(captured.type, LIVENESS_EVENTS.FRESHNESS_CHANGE);
});

test('emitTrackerChange: detail carries field, previous, current, optimistic', async () => {
  const { emitTrackerChange, LIVENESS_EVENTS } = await load();
  let captured = null;
  const target = {
    dispatchEvent: (e) => {
      captured = e;
      return true;
    },
  };
  const detail = emitTrackerChange({ field: 'currency', previous: 'AED', current: 'SAR' }, target);
  assert.equal(detail.field, 'currency');
  assert.equal(detail.previous, 'AED');
  assert.equal(detail.current, 'SAR');
  assert.equal(detail.optimistic, true);
  assert.equal(captured.type, LIVENESS_EVENTS.TRACKER_CHANGE);
});

// ── Event bus ────────────────────────────────────────────────────────────────

test('LIVENESS_EVENTS exposes the documented event names', async () => {
  const { LIVENESS_EVENTS } = await load();
  assert.equal(LIVENESS_EVENTS.GOLD_UPDATE, 'goldprice:update');
  assert.equal(LIVENESS_EVENTS.FX_UPDATE, 'fx:update');
  assert.equal(LIVENESS_EVENTS.FRESHNESS_CHANGE, 'freshness:change');
  assert.equal(LIVENESS_EVENTS.TRACKER_CHANGE, 'tracker:change');
});

test('liveness bus: on() subscribes and returns an unsubscribe', async () => {
  const { liveness, emitGoldPriceUpdate, LIVENESS_EVENTS } = await load();
  const got = [];
  const off = liveness.on(LIVENESS_EVENTS.GOLD_UPDATE, (e) => got.push(e.detail.current));
  emitGoldPriceUpdate({ previous: 1, current: 2, freshness: 'live' });
  off();
  emitGoldPriceUpdate({ previous: 2, current: 3, freshness: 'live' });
  assert.deepEqual(got, [2], 'no events received after unsubscribe');
});

test('liveness bus: a throwing listener does not break the others', async () => {
  const { liveness, emitFxUpdate, LIVENESS_EVENTS } = await load();
  const got = [];
  const originalError = console.error;
  console.error = () => {}; // silence the expected listener-error log
  const offA = liveness.on(LIVENESS_EVENTS.FX_UPDATE, () => {
    throw new Error('boom');
  });
  const offB = liveness.on(LIVENESS_EVENTS.FX_UPDATE, (e) => got.push(e.detail.freshness));
  try {
    emitFxUpdate({ previous: null, current: { USD: 1 }, freshness: 'cached' });
  } finally {
    offA();
    offB();
    console.error = originalError;
  }
  assert.deepEqual(got, ['cached']);
});
