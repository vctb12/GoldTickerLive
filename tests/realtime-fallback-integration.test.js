'use strict';

/**
 * Integration test for the realtime trust invariant:
 *
 *   When isFallback === true, no UI surface may render "Live" — even when
 *   updatedAt is a moment ago.
 *
 * This is the cross-component version of the unit-level anti-mislabel guard
 * in `tests/live-status.test.js`. It exercises:
 *
 *   - src/components/spotBar.js
 *   - src/components/ticker.js
 *   - src/lib/live-status.js#getLiveFreshness (the engine that home.js and
 *     tracker render.js both consume directly)
 *
 * If this test ever fails, treat it as a P1 trust regression — the
 * fundamental contract of `docs/realtime-validation-report.md` is broken.
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

function importModule(relPath) {
  const url = new URL('file://' + path.resolve(__dirname, '..', relPath));
  return import(url.href);
}

/* --------------------------------------------------------------------- *
 * Minimal DOM stub. Mirrors the proven shape from
 * tests/spot-bar-freshness.test.js and tests/ticker-freshness.test.js so
 * spotBar.js and ticker.js can both run against a single environment.
 * --------------------------------------------------------------------- */
function installDom() {
  const byId = new Map();

  function createElement(_tag) {
    const attrs = new Map();
    const classes = new Set();
    let _id = '';
    const el = {
      _children: [],
      _descendants: [],
      tagName: _tag.toUpperCase(),
      className: '',
      style: {},
      textContent: '',
      title: '',
      innerHTML: '',
      setAttribute(k, v) {
        attrs.set(k, String(v));
      },
      getAttribute(k) {
        return attrs.has(k) ? attrs.get(k) : null;
      },
      removeAttribute(k) {
        attrs.delete(k);
      },
      classList: {
        add: (...names) => names.forEach((n) => classes.add(n)),
        remove: (...names) => names.forEach((n) => classes.delete(n)),
        contains: (n) => classes.has(n),
        toggle: (n, on) => {
          if (on === undefined) {
            if (classes.has(n)) classes.delete(n);
            else classes.add(n);
          } else if (on) classes.add(n);
          else classes.delete(n);
        },
      },
      appendChild(child) {
        el._children.push(child);
        el._descendants.push(child);
        if (Array.isArray(child._descendants)) el._descendants.push(...child._descendants);
        return child;
      },
      append(...nodes) {
        nodes.forEach((n) => {
          if (n && typeof n === 'object') el.appendChild(n);
        });
      },
      addEventListener() {},
      removeEventListener() {},
      querySelector(sel) {
        const m = sel.match(/\[([a-z0-9-]+)(?:="([^"]+)")?\]/i);
        if (!m) return null;
        const [, attr, val] = m;
        return (
          el._descendants.find((c) =>
            val != null ? c.getAttribute(attr) === val : c.getAttribute(attr) !== null
          ) || null
        );
      },
      querySelectorAll() {
        return [];
      },
      getBoundingClientRect() {
        return { width: 0, height: 0 };
      },
      get offsetHeight() {
        return 0;
      },
    };
    Object.defineProperty(el, 'id', {
      get() {
        return _id;
      },
      set(v) {
        _id = v;
        byId.set(v, el);
      },
    });
    return el;
  }

  const body = createElement('body');
  body.appendChild = (node) => {
    body._children.push(node);
    body._descendants.push(node);
    if (Array.isArray(node._descendants)) body._descendants.push(...node._descendants);
    if (node.id) byId.set(node.id, node);
    return node;
  };
  body.insertBefore = (node) => body.appendChild(node);

  global.document = {
    createElement,
    createDocumentFragment() {
      return createElement('fragment');
    },
    getElementById(id) {
      return byId.get(id) || null;
    },
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
    body,
    documentElement: { style: { setProperty() {} } },
    addEventListener() {},
    removeEventListener() {},
  };
  global.sessionStorage = { getItem: () => null, setItem: () => {} };
  global.window = {
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    addEventListener() {},
    removeEventListener() {},
  };
  return {
    findById: (id) => byId.get(id) || null,
    restore() {
      delete global.document;
      delete global.sessionStorage;
      delete global.window;
    },
  };
}

function collectAllText(el) {
  if (!el) return '';
  const parts = [];
  if (el.textContent) parts.push(el.textContent);
  if (typeof el.getAttribute === 'function') {
    const titleAttr = el.getAttribute('title');
    if (titleAttr) parts.push(titleAttr);
    const ariaLabel = el.getAttribute('aria-label');
    if (ariaLabel) parts.push(ariaLabel);
  }
  if (el.title) parts.push(el.title);
  if (Array.isArray(el._children)) {
    for (const child of el._children) parts.push(collectAllText(child));
  }
  return parts.join(' | ');
}

// ─── spotBar ──────────────────────────────────────────────────────────────
test('integration: spotBar never renders "Live" when isFallback=true (recent timestamp)', async () => {
  const dom = installDom();
  const { injectSpotBar, updateSpotBar } = await importModule('src/components/spotBar.js');

  injectSpotBar('en', 0);
  updateSpotBar({
    xauUsd: 2300,
    aed24kGram: 280,
    updatedAt: new Date(Date.now() - 1_000).toISOString(), // 1s ago — would otherwise be "live"
    hasLiveFailure: false,
    isFallback: true,
    isFresh: true,
  });

  const bar = dom.findById('spot-price-bar');
  assert.ok(bar, 'spot bar should be mounted');
  assert.notEqual(bar.getAttribute('data-freshness'), 'live', 'data-freshness must not be "live"');
  assert.equal(bar.getAttribute('data-freshness'), 'fallback', 'data-freshness must be "fallback"');

  // The spotBar's static aria-label legitimately reads "Live gold spot prices"
  // — that's the component identity, not a freshness claim. The trust
  // invariant is about the timestamp/freshness slot, which renders the
  // fresh.timeText / fresh.ageText pair and a `title` attribute carrying
  // the freshness label. Scope the assertion to that node.
  const tsEl = bar._descendants.find(
    (n) => typeof n.getAttribute === 'function' && n.getAttribute('data-spot-ts') !== null
  );
  assert.ok(tsEl, 'spotBar timestamp slot should be present');
  const tsText = `${tsEl.textContent || ''} | ${tsEl.getAttribute('title') || ''}`;
  assert.equal(
    /\bLive\b/.test(tsText),
    false,
    `spotBar freshness slot must not contain "Live" when isFallback=true. Got: ${tsText}`
  );
  assert.equal(
    /مباشر/.test(tsText),
    false,
    `spotBar freshness slot must not contain Arabic "مباشر" when isFallback=true. Got: ${tsText}`
  );

  dom.restore();
});

// ─── ticker ───────────────────────────────────────────────────────────────
test('integration: ticker never renders "Live" when isFallback=true (recent timestamp)', async () => {
  const dom = installDom();
  const { injectTicker, updateTicker } = await importModule('src/components/ticker.js');

  injectTicker('en', 0);
  updateTicker({
    xauUsd: 2300,
    updatedAt: new Date(Date.now() - 1_000).toISOString(),
    hasLiveFailure: false,
    isFallback: true,
    isFresh: true,
  });

  const ticker = dom.findById('gold-ticker');
  assert.ok(ticker, 'ticker should be mounted');
  assert.notEqual(
    ticker.getAttribute('data-freshness'),
    'live',
    'data-freshness must not be "live"'
  );
  assert.equal(
    ticker.getAttribute('data-freshness'),
    'fallback',
    'data-freshness must be "fallback"'
  );

  // The ticker's static aria-label legitimately reads "Live gold price ticker"
  // — that's the component identity, not a freshness claim. The trust
  // invariant is about the freshness pill: its visible text, title, and
  // aria-label must reflect the fallback state. Inspect just the pill node.
  const statusEl = ticker._descendants.find(
    (n) => typeof n.getAttribute === 'function' && n.getAttribute('data-ticker-status') !== null
  );
  assert.ok(statusEl, 'ticker status pill should be present');
  const pillText = collectAllText(statusEl);
  assert.equal(
    /\bLive\b/.test(pillText),
    false,
    `ticker freshness pill must not contain "Live" when isFallback=true. Got: ${pillText}`
  );
  assert.equal(
    /مباشر/.test(pillText),
    false,
    `ticker freshness pill must not contain Arabic "مباشر" when isFallback=true. Got: ${pillText}`
  );

  dom.restore();
});

// ─── getLiveFreshness (home.js + tracker render.js shared engine) ─────────
test('integration: getLiveFreshness blocks "Live" key when isFallback=true across EN/AR', async () => {
  const { getLiveFreshness } = await importModule('src/lib/live-status.js');

  for (const lang of ['en', 'ar']) {
    for (const ageMs of [0, 500, 1_000, 5_000, 60_000]) {
      const r = getLiveFreshness({
        updatedAt: new Date(Date.now() - ageMs).toISOString(),
        hasLiveFailure: false,
        isFallback: true,
        isFresh: true, // even with isFresh=true, isFallback must dominate
        lang,
      });
      assert.equal(
        r.key,
        'fallback',
        `getLiveFreshness must return 'fallback' for lang=${lang} ageMs=${ageMs} when isFallback=true (got ${r.key})`
      );
      assert.equal(r.reason, 'upstream-fallback');
    }
  }
});
