'use strict';

/**
 * Guard test: no user-facing freshness badge text may equal "Live"
 * (or its Arabic equivalent "مباشر") when the resolved freshness key
 * is one of: fallback | stale | cached | delayed.
 *
 * Scope is intentionally narrow:
 *   - Targets only the freshness/status pill nodes on spotBar and ticker
 *     (`[data-spot-ts]` title + textContent, `[data-ticker-status-label]`
 *     textContent + pill `title`).
 *   - Drives each non-live bucket via the documented input contract
 *     (updatedAt age, hasLiveFailure, isFallback) without touching any
 *     other UI surface.
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

function importModule(relPath) {
  const url = new URL('file://' + path.resolve(__dirname, '..', relPath));
  return import(url.href);
}

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
      setAttribute: (k, v) => attrs.set(k, String(v)),
      getAttribute: (k) => (attrs.has(k) ? attrs.get(k) : null),
      removeAttribute: (k) => attrs.delete(k),
      classList: {
        add: (...n) => n.forEach((x) => classes.add(x)),
        remove: (...n) => n.forEach((x) => classes.delete(x)),
        contains: (n) => classes.has(n),
        toggle: (n, on) => (on ? classes.add(n) : classes.delete(n)),
      },
      appendChild(c) {
        el._children.push(c);
        el._descendants.push(c);
        if (Array.isArray(c._descendants)) el._descendants.push(...c._descendants);
        return c;
      },
      append(...nodes) {
        nodes.forEach((n) => n && typeof n === 'object' && el.appendChild(n));
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
      querySelectorAll: () => [],
      getBoundingClientRect: () => ({ width: 0, height: 0 }),
      get offsetHeight() {
        return 0;
      },
    };
    Object.defineProperty(el, 'id', {
      get: () => _id,
      set: (v) => {
        _id = v;
        byId.set(v, el);
      },
    });
    return el;
  }
  const body = createElement('body');
  body.appendChild = (n) => {
    body._children.push(n);
    body._descendants.push(n);
    if (Array.isArray(n._descendants)) body._descendants.push(...n._descendants);
    if (n.id) byId.set(n.id, n);
    return n;
  };
  body.insertBefore = (n) => body.appendChild(n);

  global.document = {
    createElement,
    createDocumentFragment: () => createElement('fragment'),
    getElementById: (id) => byId.get(id) || null,
    querySelector: () => null,
    querySelectorAll: () => [],
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

// Scenarios that resolve to each non-live freshness key, per live-status.js.
// Thresholds: DELAYED_AFTER_MS = 30 min, STALE_AFTER_MS = 75 min.
const NOW = Date.now();
function isoMinAgo(min) {
  return new Date(NOW - min * 60 * 1000).toISOString();
}
const SCENARIOS = [
  { key: 'fallback', data: { updatedAt: isoMinAgo(0), hasLiveFailure: false, isFallback: true } },
  { key: 'stale', data: { updatedAt: isoMinAgo(90), hasLiveFailure: false } },
  { key: 'cached', data: { updatedAt: isoMinAgo(1), hasLiveFailure: true } },
  { key: 'delayed', data: { updatedAt: isoMinAgo(45), hasLiveFailure: false } },
];

const LIVE_TEXT_RE = /\b(Live|مباشر)\b/u;

test('guard: spotBar freshness badge never reads "Live" for non-live keys (EN+AR)', async () => {
  const { injectSpotBar, updateSpotBar } = await importModule('src/components/spotBar.js');
  for (const lang of ['en', 'ar']) {
    for (const { key, data } of SCENARIOS) {
      const dom = installDom();
      injectSpotBar(lang, 0);
      updateSpotBar({ xauUsd: 2300, aed24kGram: 280, ...data });
      const bar = dom.findById('spot-price-bar');
      assert.ok(bar, `[${lang}/${key}] spot bar should be mounted`);
      assert.equal(
        bar.getAttribute('data-freshness'),
        key,
        `[${lang}/${key}] data-freshness mismatch`
      );
      const tsEl = bar._descendants.find(
        (n) => typeof n.getAttribute === 'function' && n.getAttribute('data-spot-ts') !== null
      );
      assert.ok(tsEl, `[${lang}/${key}] timestamp slot must exist`);
      const badgeText = `${tsEl.textContent || ''} | ${tsEl.getAttribute('title') || ''}`;
      assert.equal(
        LIVE_TEXT_RE.test(badgeText),
        false,
        `[${lang}/${key}] spotBar badge must not contain "Live"/"مباشر". Got: ${badgeText}`
      );
      dom.restore();
    }
  }
});

test('guard: ticker freshness pill never reads "Live" for non-live keys (EN+AR)', async () => {
  const { injectTicker, updateTicker } = await importModule('src/components/ticker.js');
  for (const lang of ['en', 'ar']) {
    for (const { key, data } of SCENARIOS) {
      const dom = installDom();
      injectTicker(lang, 0);
      updateTicker({ xauUsd: 2300, ...data });
      const ticker = dom.findById('gold-ticker');
      assert.ok(ticker, `[${lang}/${key}] ticker should be mounted`);
      assert.equal(
        ticker.getAttribute('data-freshness'),
        key,
        `[${lang}/${key}] data-freshness mismatch`
      );
      const statusEl = ticker._descendants.find(
        (n) => typeof n.getAttribute === 'function' && n.getAttribute('data-ticker-status') !== null
      );
      const labelEl = ticker._descendants.find(
        (n) =>
          typeof n.getAttribute === 'function' &&
          n.getAttribute('data-ticker-status-label') !== null
      );
      assert.ok(statusEl && labelEl, `[${lang}/${key}] ticker status nodes must exist`);
      const badgeText = `${labelEl.textContent || ''} | ${statusEl.getAttribute('title') || ''} | ${statusEl.getAttribute('aria-label') || ''}`;
      assert.equal(
        LIVE_TEXT_RE.test(badgeText),
        false,
        `[${lang}/${key}] ticker pill must not contain "Live"/"مباشر". Got: ${badgeText}`
      );
      dom.restore();
    }
  }
});
