'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

async function load() {
  const url = new URL(
    'file://' + path.resolve(__dirname, '..', 'src', 'lib', 'visibility-refresh.js')
  );
  return import(url.href + `?v=${Date.now()}`);
}

/** Minimal EventTarget stub capturing listeners so tests can fire events. */
function makeEmitter(extra = {}) {
  const listeners = new Map();
  return {
    ...extra,
    addEventListener(type, fn) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
    },
    removeEventListener(type, fn) {
      listeners.get(type)?.delete(fn);
    },
    emit(type) {
      for (const fn of listeners.get(type) || []) fn();
    },
    listenerCount(type) {
      return listeners.get(type)?.size || 0;
    },
  };
}

const INTERVAL = 90_000;

test('visibility-refresh: starts polling when the tab is visible', async () => {
  const { startVisibilityAwareRefresh } = await load();
  const doc = makeEmitter({ hidden: false });
  const win = makeEmitter();
  let calls = 0;
  const ctrl = startVisibilityAwareRefresh(() => calls++, { intervalMs: INTERVAL, doc, win });

  assert.equal(ctrl.isRunning(), true, 'interval active on a visible tab');
  assert.equal(calls, 0, 'no start-time refresh (caller already fetched once)');
  ctrl.stop();
});

test('visibility-refresh: starts paused when the tab loads hidden', async () => {
  const { startVisibilityAwareRefresh } = await load();
  const doc = makeEmitter({ hidden: true });
  const win = makeEmitter();
  const ctrl = startVisibilityAwareRefresh(() => {}, { intervalMs: INTERVAL, doc, win });

  assert.equal(ctrl.isRunning(), false, 'no polling on a hidden tab');
  ctrl.stop();
});

test('visibility-refresh: pauses on hide, catches up + resumes on show', async () => {
  const { startVisibilityAwareRefresh } = await load();
  const doc = makeEmitter({ hidden: false });
  const win = makeEmitter();
  let calls = 0;
  const ctrl = startVisibilityAwareRefresh(() => calls++, { intervalMs: INTERVAL, doc, win });

  // Hide → stop polling, no extra refresh.
  doc.hidden = true;
  doc.emit('visibilitychange');
  assert.equal(ctrl.isRunning(), false, 'polling paused while hidden');
  assert.equal(calls, 0, 'no refresh fired on hide');

  // Show → immediate catch-up refresh + resumed interval.
  doc.hidden = false;
  doc.emit('visibilitychange');
  assert.equal(calls, 1, 'exactly one catch-up refresh on re-show');
  assert.equal(ctrl.isRunning(), true, 'polling resumed on re-show');

  ctrl.stop();
});

test('visibility-refresh: repeated show events do not stack intervals or double-fetch', async () => {
  const { startVisibilityAwareRefresh } = await load();
  const doc = makeEmitter({ hidden: false });
  const win = makeEmitter();
  let calls = 0;
  const ctrl = startVisibilityAwareRefresh(() => calls++, { intervalMs: INTERVAL, doc, win });

  // Already visible — a spurious visibilitychange must not add a second interval
  // or trigger a refresh (guarded by the `timer == null` check).
  doc.emit('visibilitychange');
  doc.emit('visibilitychange');
  assert.equal(calls, 0, 'no refresh while already visible');
  assert.equal(ctrl.isRunning(), true);
  ctrl.stop();
});

test('visibility-refresh: pagehide tears down interval and removes listeners', async () => {
  const { startVisibilityAwareRefresh } = await load();
  const doc = makeEmitter({ hidden: false });
  const win = makeEmitter();
  const ctrl = startVisibilityAwareRefresh(() => {}, { intervalMs: INTERVAL, doc, win });

  assert.equal(doc.listenerCount('visibilitychange'), 1);
  assert.equal(win.listenerCount('pagehide'), 1);

  win.emit('pagehide');
  assert.equal(ctrl.isRunning(), false, 'interval cleared on pagehide');
  assert.equal(doc.listenerCount('visibilitychange'), 0, 'visibility listener removed');
  assert.equal(win.listenerCount('pagehide'), 0, 'pagehide listener removed');
});

test('visibility-refresh: stop() is idempotent and clears everything', async () => {
  const { startVisibilityAwareRefresh } = await load();
  const doc = makeEmitter({ hidden: false });
  const win = makeEmitter();
  const ctrl = startVisibilityAwareRefresh(() => {}, { intervalMs: INTERVAL, doc, win });
  ctrl.stop();
  ctrl.stop();
  assert.equal(ctrl.isRunning(), false);
});

test('visibility-refresh: invalid args yield an inert controller', async () => {
  const { startVisibilityAwareRefresh } = await load();
  const doc = makeEmitter({ hidden: false });
  const win = makeEmitter();

  const noFn = startVisibilityAwareRefresh(null, { intervalMs: INTERVAL, doc, win });
  assert.equal(noFn.isRunning(), false);
  assert.equal(doc.listenerCount('visibilitychange'), 0, 'no listeners wired for a bad refresh fn');

  const badInterval = startVisibilityAwareRefresh(() => {}, { intervalMs: 0, doc, win });
  assert.equal(badInterval.isRunning(), false);
  noFn.stop();
  badInterval.stop();
});
