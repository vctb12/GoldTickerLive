'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

const readSrc = (rel) => fs.readFileSync(path.resolve(__dirname, '..', rel), 'utf8');

async function loadPriceMotion() {
  const url = new URL('file://' + path.resolve(__dirname, '..', 'src', 'lib', 'price-motion.js'));
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

test('initMotionBoot is idempotent across repeated calls (no throw)', async () => {
  const { initMotionBoot } = await loadMotionBoot();
  assert.doesNotThrow(() => {
    initMotionBoot();
    initMotionBoot();
    initMotionBoot();
  });
});

test('motion-boot fully guards every view-transition promise path', () => {
  const boot = readSrc('src/lib/motion-boot.js');
  // All three VT promise paths are catch-guarded so an aborted navigation never
  // surfaces as an uncaught InvalidStateError rejection.
  assert.match(boot, /transition\.ready\?\.catch/, 'ready must be catch-guarded');
  assert.match(boot, /transition\.finished\?\.catch/, 'finished must be catch-guarded');
  assert.match(
    boot,
    /transition\.updateCallbackDone\?\.catch/,
    'updateCallbackDone must be catch-guarded'
  );
});

test('motion-boot guards double-init and a synchronous startViewTransition throw', () => {
  const boot = readSrc('src/lib/motion-boot.js');
  // Dedicated idempotency flag prevents double-binding the click listener.
  assert.match(boot, /viewTransitionsBound/, 'view-transition binding must be idempotent');
  // startViewTransition is wrapped so a synchronous throw falls back to plain nav.
  assert.match(
    boot,
    /try\s*{[\s\S]*document\.startViewTransition/,
    'startViewTransition must be wrapped in try/catch'
  );
});

test('motion-boot re-checks reduced motion at click time (before any transition)', () => {
  const boot = readSrc('src/lib/motion-boot.js');
  // prefersReducedMotion is evaluated again inside the click handler, before
  // preventDefault, so a reduced-motion preference never yields a transition.
  const preventIdx = boot.indexOf('e.preventDefault()');
  const reducedInHandler = boot.lastIndexOf('if (prefersReducedMotion()) return;', preventIdx);
  assert.ok(
    reducedInHandler !== -1 && reducedInHandler < preventIdx,
    'reduced-motion short-circuit must run before preventDefault()'
  );
});
