'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

async function load() {
  const url = new URL(
    'file://' + path.resolve(__dirname, '..', 'src', 'lib', 'freshness-pulse.js')
  );
  return import(url.href);
}

function createFakeEl() {
  const attrs = new Map();
  return {
    setAttribute(name, value) {
      attrs.set(name, String(value));
    },
    removeAttribute(name) {
      attrs.delete(name);
    },
    getAttribute(name) {
      return attrs.has(name) ? attrs.get(name) : null;
    },
    hasAttribute(name) {
      return attrs.has(name);
    },
    _attrs: attrs,
  };
}

test('pulseFreshness() sets and clears data-freshness-pulse attribute', async () => {
  const { pulseFreshness, FRESHNESS_PULSE_DURATION_MS } = await load();
  const el = createFakeEl();

  const pulsed = pulseFreshness(el);
  assert.equal(pulsed, true);
  assert.equal(el.hasAttribute('data-freshness-pulse'), true);

  await new Promise((r) => setTimeout(r, FRESHNESS_PULSE_DURATION_MS + 50));
  assert.equal(el.hasAttribute('data-freshness-pulse'), false);
});

test('pulseFreshness() is throttled per element at the configured interval', async () => {
  const { pulseFreshness } = await load();
  const el = createFakeEl();

  assert.equal(pulseFreshness(el, { minIntervalMs: 50_000 }), true);
  assert.equal(pulseFreshness(el, { minIntervalMs: 50_000 }), false);

  // A separate element is not affected by the throttle on the first one.
  const other = createFakeEl();
  assert.equal(pulseFreshness(other, { minIntervalMs: 50_000 }), true);
});

test('pulseFreshness() allows a subsequent pulse once the window elapses', async () => {
  const { pulseFreshness } = await load();
  const el = createFakeEl();

  assert.equal(pulseFreshness(el, { minIntervalMs: 20 }), true);
  await new Promise((r) => setTimeout(r, 30));
  assert.equal(pulseFreshness(el, { minIntervalMs: 20 }), true);
});

test('pulseFreshness() returns false for invalid targets', async () => {
  const { pulseFreshness } = await load();

  assert.equal(pulseFreshness(null), false);
  assert.equal(pulseFreshness(undefined), false);
  assert.equal(pulseFreshness({}), false);
});
