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

test('isSameDocumentHashLink: same path+query, different hash is same-document', async () => {
  const { isSameDocumentHashLink } = await loadMotionBoot();
  global.location = { origin: 'https://goldtickerlive.com', pathname: '/learn.html', search: '' };
  const url = new URL('https://goldtickerlive.com/learn.html#karats');
  assert.equal(isSameDocumentHashLink(url), true);
  delete global.location;
});

test('isSameDocumentHashLink: different path is not same-document', async () => {
  const { isSameDocumentHashLink } = await loadMotionBoot();
  global.location = { origin: 'https://goldtickerlive.com', pathname: '/learn.html', search: '' };
  const url = new URL('https://goldtickerlive.com/methodology.html#x');
  assert.equal(isSameDocumentHashLink(url), false);
  delete global.location;
});

test('isSameDocumentHashLink: no location global never throws', async () => {
  const { isSameDocumentHashLink } = await loadMotionBoot();
  delete global.location;
  const url = new URL('https://goldtickerlive.com/learn.html#karats');
  assert.doesNotThrow(() => isSameDocumentHashLink(url));
  assert.equal(isSameDocumentHashLink(url), false);
});

test('isSameOriginNavLink: excludes same-document hash anchors (the learn.html guide-card bug)', async () => {
  const { isSameOriginNavLink } = await loadMotionBoot();
  global.location = {
    origin: 'https://goldtickerlive.com',
    pathname: '/learn.html',
    search: '',
    href: 'https://goldtickerlive.com/learn.html',
  };
  const anchor = {
    tagName: 'A',
    href: 'https://goldtickerlive.com/learn.html#karats',
    getAttribute: (name) => (name === 'href' ? '/learn.html#karats' : null),
    hasAttribute: () => false,
  };
  assert.equal(
    isSameOriginNavLink(anchor),
    false,
    'same-document hash anchors must never be wrapped in a view transition'
    );
  delete global.location;
});

test('isSameOriginNavLink: still hijacks real cross-page same-origin links', async () => {
  const { isSameOriginNavLink } = await loadMotionBoot();
  global.location = {
    origin: 'https://goldtickerlive.com',
    pathname: '/learn.html',
    search: '',
    href: 'https://goldtickerlive.com/learn.html',
  };
  const anchor = {
    tagName: 'A',
    href: 'https://goldtickerlive.com/methodology.html',
    getAttribute: (name) => (name === 'href' ? '/methodology.html' : null),
    hasAttribute: () => false,
  };
  assert.equal(isSameOriginNavLink(anchor), true);
  delete global.location;
});

test('isSameOriginNavLink: rejects bare-hash, mailto, tel, download, cross-origin, non-anchor', async () => {
  const { isSameOriginNavLink } = await loadMotionBoot();
  global.location = {
    origin: 'https://goldtickerlive.com',
    pathname: '/learn.html',
    search: '',
    href: 'https://goldtickerlive.com/learn.html',
  };
  const make = (href, extra = {}) => ({
    tagName: 'A',
    href: new URL(href, global.location.href).href,
    getAttribute: (name) => (name === 'href' ? href : null),
    hasAttribute: (name) => Boolean(extra[name]),
  });
  assert.equal(isSameOriginNavLink(make('#top')), false);
  assert.equal(isSameOriginNavLink(make('mailto:a@b.com')), false);
  assert.equal(isSameOriginNavLink(make('tel:+1234')), false);
  assert.equal(isSameOriginNavLink(make('/methodology.html', { download: true })), false);
  assert.equal(isSameOriginNavLink(make('https://example.com/x')), false);
  assert.equal(isSameOriginNavLink({ tagName: 'DIV' }), false);
  assert.equal(isSameOriginNavLink(null), false);
  delete global.location;
});
