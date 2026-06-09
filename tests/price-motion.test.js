'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

async function loadPriceMotion() {
  const url = new URL(
    'file://' + path.resolve(__dirname, '..', 'src', 'lib', 'price-motion.js')
  );
  return import(url.href);
}

async function loadMotionBoot() {
  const url = new URL('file://' + path.resolve(__dirname, '..', 'src', 'lib', 'motion-boot.js'));
  return import(url.href);
}

test('price-motion exports animatePrice, pulseSpotTerminal, tickFreshnessPill', async () => {
  const mod = await loadPriceMotion();
  assert.equal(typeof mod.animatePrice, 'function');
  assert.equal(typeof mod.pulseSpotTerminal, 'function');
  assert.equal(typeof mod.tickFreshnessPill, 'function');
  assert.equal(mod.HERO_FRESHNESS_THROTTLE_MS, 3000);
});

test('pulseSpotTerminal toggles live class and flash attribute', async () => {
  const { pulseSpotTerminal } = await loadPriceMotion();
  const root = {
    classList: { toggle() {} },
    setAttribute() {},
    removeAttribute() {},
  };
  let toggled = false;
  let flash = null;
  root.classList.toggle = (cls, on) => {
    if (cls === 'spot-terminal--live') toggled = on;
  };
  root.setAttribute = (k, v) => {
    if (k === 'data-price-flash') flash = v;
  };
  root.removeAttribute = (k) => {
    if (k === 'data-price-flash') flash = null;
  };

  pulseSpotTerminal(root, { direction: 'up', isLive: true });
  assert.equal(toggled, true);
  assert.equal(flash, 'up');
});

test('animatePrice no-ops on invalid input', async () => {
  const { animatePrice } = await loadPriceMotion();
  assert.doesNotThrow(() => animatePrice(null, 100));
  assert.doesNotThrow(() => animatePrice({ textContent: '' }, NaN));
});

test('initMotionBoot is safe to call in Node (no document)', async () => {
  const { initMotionBoot } = await loadMotionBoot();
  assert.doesNotThrow(() => initMotionBoot());
});
