'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

// Optimistic tracker control updates + live-data reconciliation.
// Locks: (a) control changes mutate state and emit `tracker:change`
// SYNCHRONOUSLY, (b) the URL-hash contract still round-trips, and (c) the
// freshness honesty TRUST RULE survives reconciliation — a cached/fallback
// value never produces a directional flash.

async function loadState() {
  const url = new URL('file://' + path.resolve(__dirname, '..', 'src', 'tracker', 'state.js'));
  return import(url.href);
}
async function loadAnim() {
  const url = new URL('file://' + path.resolve(__dirname, '..', 'src', 'lib', 'animation.js'));
  return import(url.href);
}

function baseControlState() {
  return {
    mode: 'live',
    selectedCurrency: 'AED',
    selectedKarat: '24',
    selectedUnit: 'gram',
    range: '30D',
    compareCurrency: 'USD',
    lang: 'en',
    historyMonth: '',
    panel: null,
  };
}

// ── updateControl ────────────────────────────────────────────────────────────

test('updateControl: mutates state and reports the change', async () => {
  const { updateControl } = await loadState();
  const state = baseControlState();
  const res = updateControl(state, 'currency', 'SAR', { persist: false, syncUrl: false });
  assert.equal(res.changed, true);
  assert.equal(res.previous, 'AED');
  assert.equal(res.current, 'SAR');
  assert.equal(state.selectedCurrency, 'SAR');
});

test('updateControl: emits tracker:change SYNCHRONOUSLY', async () => {
  const { updateControl } = await loadState();
  const { liveness, LIVENESS_EVENTS } = await loadAnim();
  const events = [];
  const off = liveness.on(LIVENESS_EVENTS.TRACKER_CHANGE, (e) => events.push(e.detail));
  const state = baseControlState();
  try {
    updateControl(state, 'karat', '22', { persist: false, syncUrl: false });
    // Event is already present immediately after the call returns — i.e. synchronous.
    assert.equal(events.length, 1);
    assert.equal(events[0].field, 'karat');
    assert.equal(events[0].previous, '24');
    assert.equal(events[0].current, '22');
    assert.equal(events[0].optimistic, true);
  } finally {
    off();
  }
});

test('updateControl: no event and changed:false when value is unchanged', async () => {
  const { updateControl } = await loadState();
  const { liveness, LIVENESS_EVENTS } = await loadAnim();
  const events = [];
  const off = liveness.on(LIVENESS_EVENTS.TRACKER_CHANGE, (e) => events.push(e.detail));
  const state = baseControlState();
  try {
    const res = updateControl(state, 'karat', '24', { persist: false, syncUrl: false });
    assert.equal(res.changed, false);
    assert.equal(events.length, 0);
  } finally {
    off();
  }
});

test('updateControl: rejects an invalid mode (VALID_MODES guard)', async () => {
  const { updateControl } = await loadState();
  const state = baseControlState();
  const res = updateControl(state, 'mode', 'bogus', { persist: false, syncUrl: false });
  assert.equal(res.rejected, true);
  assert.equal(res.reason, 'invalid-value');
  assert.equal(state.mode, 'live', 'state is untouched on rejection');
});

test('updateControl: rejects an unknown field', async () => {
  const { updateControl } = await loadState();
  const state = baseControlState();
  const res = updateControl(state, 'nope', 'x', { persist: false, syncUrl: false });
  assert.equal(res.rejected, true);
  assert.equal(res.reason, 'unknown-field');
});

test('named setters delegate to updateControl', async () => {
  const { setMode, setCurrency, setKarat, setUnit, setRange, CONTROL_FIELD_NAMES } =
    await loadState();
  const state = baseControlState();
  assert.deepEqual([...CONTROL_FIELD_NAMES].sort(), ['currency', 'karat', 'mode', 'range', 'unit']);
  setMode(state, 'compare', { persist: false, syncUrl: false });
  setCurrency(state, 'USD', { persist: false, syncUrl: false });
  setKarat(state, '21', { persist: false, syncUrl: false });
  setUnit(state, 'oz', { persist: false, syncUrl: false });
  setRange(state, '90D', { persist: false, syncUrl: false });
  assert.equal(state.mode, 'compare');
  assert.equal(state.selectedCurrency, 'USD');
  assert.equal(state.selectedKarat, '21');
  assert.equal(state.selectedUnit, 'oz');
  assert.equal(state.range, '90D');
});

// ── URL-hash round-trip (the #mode=…&cur=…&k=…&u=…&r=… contract) ──────────────

test('updateControl keeps the URL-hash sync round-tripping', async () => {
  const loc = { href: 'https://goldtickerlive.com/tracker.html', hash: '' };
  const previousWindow = global.window;
  const previousHistory = global.history;
  global.window = { location: loc };
  global.history = {
    replaceState: (_state, _title, urlStr) => {
      const u = new URL(urlStr);
      loc.href = u.href;
      loc.hash = u.hash;
    },
  };
  try {
    const { updateControl, applyUrlState } = await loadState();
    const state = baseControlState();

    updateControl(state, 'mode', 'compare', { persist: false });
    updateControl(state, 'currency', 'SAR', { persist: false });
    updateControl(state, 'karat', '22', { persist: false });
    updateControl(state, 'unit', 'oz', { persist: false });
    updateControl(state, 'range', '90D', { persist: false });

    // The hash written by syncUrlFromState must reconstruct the same controls.
    const fresh = baseControlState();
    const parsed = applyUrlState(fresh);
    assert.equal(parsed.hasHash, true);
    assert.equal(fresh.mode, 'compare');
    assert.equal(fresh.selectedCurrency, 'SAR');
    assert.equal(fresh.selectedKarat, '22');
    assert.equal(fresh.selectedUnit, 'oz');
    assert.equal(fresh.range, '90D');
  } finally {
    if (previousWindow === undefined) delete global.window;
    else global.window = previousWindow;
    if (previousHistory === undefined) delete global.history;
    else global.history = previousHistory;
  }
});

// ── applyLiveUpdate (reconcile) ──────────────────────────────────────────────

test('applyLiveUpdate: a live tick reports direction and updates state.live', async () => {
  const { applyLiveUpdate } = await loadState();
  const state = { live: { price: 100 } };
  const res = applyLiveUpdate(state, {
    price: 110,
    updatedAt: new Date().toISOString(),
    isFresh: true,
  });
  assert.equal(res.freshness, 'live');
  assert.equal(res.direction, 'up');
  assert.equal(res.current, 110);
  assert.equal(res.changed, true);
  assert.equal(state.live.price, 110);
  assert.equal(state.hasLiveFailure, false);
});

test('applyLiveUpdate: a cached/fallback value NEVER flashes (trust rule)', async () => {
  const { applyLiveUpdate } = await loadState();
  const state = { live: { price: 100 } };
  const res = applyLiveUpdate(state, {
    price: 110, // a real up-move …
    updatedAt: new Date().toISOString(),
    isFallback: true, // … but upstream flagged it a fallback
  });
  assert.equal(res.freshness, 'fallback');
  assert.equal(res.direction, 'unchanged', 'fallback data must not produce a directional flash');
  assert.equal(state.hasLiveFailure, true);
});

test('applyLiveUpdate: tracks freshness transitions', async () => {
  const { applyLiveUpdate } = await loadState();
  const state = {};
  const now = new Date().toISOString();
  const first = applyLiveUpdate(state, { price: 100, updatedAt: now, isFresh: true });
  assert.equal(
    first.freshnessChanged,
    false,
    'first reconcile has no prior state to transition from'
  );
  assert.equal(first.previousFreshness, null);

  const second = applyLiveUpdate(state, { price: 100, updatedAt: now, isFallback: true });
  assert.equal(second.freshnessChanged, true);
  assert.equal(second.previousFreshness, 'live');
  assert.equal(second.freshness, 'fallback');
});

test('applyLiveUpdate: emit:false (default) does not dispatch; emit:true does', async () => {
  const { applyLiveUpdate } = await loadState();
  const { liveness, LIVENESS_EVENTS } = await loadAnim();
  const got = [];
  const off = liveness.on(LIVENESS_EVENTS.GOLD_UPDATE, (e) => got.push(e.detail));
  try {
    const state = { live: { price: 100 } };
    applyLiveUpdate(state, { price: 105, updatedAt: new Date().toISOString(), isFresh: true });
    assert.equal(got.length, 0, 'default does not double-emit (lib/api.js owns goldprice:update)');

    applyLiveUpdate(
      state,
      { price: 90, updatedAt: new Date().toISOString(), isFallback: true },
      { emit: true }
    );
    assert.equal(got.length, 1);
    assert.equal(got[0].direction, 'unchanged', 'emitted fallback honours the trust rule');
    assert.equal(got[0].freshness, 'fallback');
  } finally {
    off();
  }
});
