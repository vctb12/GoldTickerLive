'use strict';

/**
 * Unit tests for the focus-trap utility's pure Tab-wrapping core
 * (`resolveTrapTarget`) and `getFocusable` filtering. These cover the
 * keyboard-navigation contract the shop detail dialog relies on
 * (WCAG 2.4.3) without needing a full DOM.
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

async function load() {
  const url = new URL('file://' + path.resolve(__dirname, '..', 'src', 'lib', 'focus-trap.js'));
  return import(url.href);
}

// Minimal stand-ins; identity comparison is all resolveTrapTarget needs.
const A = { id: 'a' };
const B = { id: 'b' };
const C = { id: 'c' };
const OUTSIDE = { id: 'outside' };
const list = [A, B, C];

function containerOf(members) {
  return { contains: (n) => members.includes(n) };
}

test('resolveTrapTarget: empty list returns null', async () => {
  const { resolveTrapTarget } = await load();
  assert.equal(resolveTrapTarget([], A, false), null);
  assert.equal(resolveTrapTarget(null, A, false), null);
});

test('resolveTrapTarget: Tab on last wraps to first', async () => {
  const { resolveTrapTarget } = await load();
  assert.equal(resolveTrapTarget(list, C, false, containerOf(list)), A);
});

test('resolveTrapTarget: Shift+Tab on first wraps to last', async () => {
  const { resolveTrapTarget } = await load();
  assert.equal(resolveTrapTarget(list, A, true, containerOf(list)), C);
});

test('resolveTrapTarget: Tab in the middle proceeds naturally (null)', async () => {
  const { resolveTrapTarget } = await load();
  assert.equal(resolveTrapTarget(list, B, false, containerOf(list)), null);
  assert.equal(resolveTrapTarget(list, B, true, containerOf(list)), null);
});

test('resolveTrapTarget: focus escaped the container is pulled back inside', async () => {
  const { resolveTrapTarget } = await load();
  // Tab while focus is outside → first; Shift+Tab while outside → last.
  assert.equal(resolveTrapTarget(list, OUTSIDE, false, containerOf(list)), A);
  assert.equal(resolveTrapTarget(list, OUTSIDE, true, containerOf(list)), C);
});

test('resolveTrapTarget: without a container, membership in list defines "inside"', async () => {
  const { resolveTrapTarget } = await load();
  assert.equal(resolveTrapTarget(list, C, false), A); // last → first
  assert.equal(resolveTrapTarget(list, OUTSIDE, false), A); // not a member → pulled in
});

test('getFocusable: returns [] for null / non-element', async () => {
  const { getFocusable } = await load();
  assert.deepEqual(getFocusable(null), []);
  assert.deepEqual(getFocusable({}), []);
});

test('getFocusable: filters to visible focusables in DOM order', async () => {
  const { getFocusable } = await load();
  // visible elements have offsetParent !== null; hidden has null.
  const visible1 = { offsetParent: {}, tag: 'a' };
  const hidden = { offsetParent: null, tag: 'button' };
  const visible2 = { offsetParent: {}, tag: 'button' };
  const container = {
    ownerDocument: { activeElement: null },
    querySelectorAll: () => [visible1, hidden, visible2],
  };
  assert.deepEqual(getFocusable(container), [visible1, visible2]);
});

test('createFocusTrap: activate stores trigger and deactivate restores it', async () => {
  const { createFocusTrap } = await load();
  let focused = null;
  const trigger = {
    isConnected: true,
    focus() {
      focused = 'trigger';
    },
  };
  const closeBtn = {
    offsetParent: {},
    focus() {
      focused = 'close';
    },
  };
  const listeners = {};
  const container = {
    ownerDocument: { activeElement: trigger },
    hasAttribute: () => true,
    contains: (n) => n === closeBtn,
    querySelectorAll: () => [closeBtn],
    addEventListener: (type, fn) => {
      listeners[type] = fn;
    },
    removeEventListener: (type) => {
      delete listeners[type];
    },
  };
  // Run synchronously: stub requestAnimationFrame.
  const prevRaf = globalThis.requestAnimationFrame;
  globalThis.requestAnimationFrame = (fn) => fn();
  try {
    const trap = createFocusTrap(container, { initialFocus: () => closeBtn });
    trap.activate();
    assert.equal(trap.isActive(), true);
    assert.equal(typeof listeners.keydown, 'function', 'keydown listener attached');
    assert.equal(focused, 'close', 'focus moved into the dialog on activate');
    trap.deactivate();
    assert.equal(trap.isActive(), false);
    assert.equal(listeners.keydown, undefined, 'keydown listener removed');
    assert.equal(focused, 'trigger', 'focus restored to the trigger on deactivate');
  } finally {
    globalThis.requestAnimationFrame = prevRaf;
  }
});
