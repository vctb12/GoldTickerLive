'use strict';

/**
 * Regression coverage for src/lib/site-settings.js — public feature-flag cache.
 *
 * Risky behavior: defaults merge, corrupt-cache fail-open, network failure
 * falls back to cache/defaults, TTL freshness, and applyFeatureFlags hiding
 * dark-mode / order-gold / alerts surfaces when disabled.
 */

const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const CACHE_KEY = 'gp_site_settings';

function createLocalStorageMock(initial = {}) {
  const store = new Map(Object.entries(initial));
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => {
      store.set(key, String(value));
    },
    removeItem: (key) => {
      store.delete(key);
    },
    clear: () => store.clear(),
    _store: store,
  };
}

function installDom() {
  const byId = new Map();
  const anchors = [];

  function makeEl(tag, id) {
    const node = {
      tagName: String(tag).toUpperCase(),
      id: id || '',
      style: { display: '' },
      href: '',
    };
    if (id) byId.set(id, node);
    return node;
  }

  const themeBtn = makeEl('button', 'nav-theme-toggle');
  const alertTab = makeEl('button', 'tab-alerts');
  const alertPanel = makeEl('div', 'tp-overlay-alerts');
  const orderLink = makeEl('a');
  orderLink.href = '/order-gold.html';
  const alertLink = makeEl('a');
  alertLink.href = '/tracker.html?panel=alerts';
  anchors.push(orderLink, alertLink);

  global.document = {
    getElementById: (id) => byId.get(id) || null,
    querySelectorAll: (sel) => {
      if (sel.includes('order-gold')) return [orderLink];
      if (sel.includes('panel=alerts')) return [alertLink];
      return [];
    },
  };

  return { themeBtn, alertTab, alertPanel, orderLink, alertLink };
}

async function loadFresh() {
  const url = new URL('file://' + path.resolve(__dirname, '..', 'src', 'lib', 'site-settings.js'));
  return import(url.href + `?v=${Date.now()}-${Math.random()}`);
}

beforeEach(() => {
  delete global.fetch;
  delete global.localStorage;
  delete global.document;
});

afterEach(() => {
  delete global.fetch;
  delete global.localStorage;
  delete global.document;
});

test('getCachedSiteSettings returns full feature defaults when cache is empty', async () => {
  global.localStorage = createLocalStorageMock();
  const { getCachedSiteSettings } = await loadFresh();
  const settings = getCachedSiteSettings();
  assert.equal(settings.features.darkMode, true);
  assert.equal(settings.features.newsletter, false);
  assert.equal(settings.features.portfolioTracker, true);
  assert.equal(settings.features.orderGold, true);
  assert.equal(settings.features.priceAlerts, true);
});

test('getCachedSiteSettings merges partial cached features over defaults', async () => {
  global.localStorage = createLocalStorageMock({
    [CACHE_KEY]: JSON.stringify({
      value: { features: { darkMode: false, newsletter: true } },
      ts: Date.now(),
    }),
  });
  const { getCachedSiteSettings } = await loadFresh();
  const settings = getCachedSiteSettings();
  assert.equal(settings.features.darkMode, false);
  assert.equal(settings.features.newsletter, true);
  assert.equal(settings.features.orderGold, true, 'unset flags keep defaults');
});

test('getCachedSiteSettings fails open to defaults on corrupt JSON', async () => {
  global.localStorage = createLocalStorageMock({
    [CACHE_KEY]: '{not-json',
  });
  const { getCachedSiteSettings } = await loadFresh();
  const settings = getCachedSiteSettings();
  assert.equal(settings.features.darkMode, true);
  assert.equal(settings.features.priceAlerts, true);
});

test('loadSiteSettings returns cache when TTL is still fresh (no network)', async () => {
  let fetchCalls = 0;
  global.fetch = async () => {
    fetchCalls += 1;
    throw new Error('should not fetch');
  };
  global.localStorage = createLocalStorageMock({
    [CACHE_KEY]: JSON.stringify({
      value: { features: { darkMode: false } },
      ts: Date.now() - 60_000, // 1 minute < 5 minute TTL
    }),
  });
  const { loadSiteSettings } = await loadFresh();
  const settings = await loadSiteSettings();
  assert.equal(fetchCalls, 0);
  assert.equal(settings.features.darkMode, false);
});

test('loadSiteSettings fetches when cache is stale and updates localStorage', async () => {
  global.localStorage = createLocalStorageMock({
    [CACHE_KEY]: JSON.stringify({
      value: { features: { darkMode: true } },
      ts: Date.now() - 10 * 60 * 1000, // stale
    }),
  });
  global.fetch = async () => ({
    ok: true,
    json: async () => [{ value: { features: { darkMode: false, orderGold: false } } }],
  });
  const { loadSiteSettings, getCachedSiteSettings } = await loadFresh();
  const settings = await loadSiteSettings();
  assert.equal(settings.features.darkMode, false);
  assert.equal(settings.features.orderGold, false);
  const cached = getCachedSiteSettings();
  assert.equal(cached.features.darkMode, false);
});

test('loadSiteSettings falls back to cache/defaults when fetch fails', async () => {
  global.localStorage = createLocalStorageMock({
    [CACHE_KEY]: JSON.stringify({
      value: { features: { newsletter: true } },
      ts: Date.now() - 10 * 60 * 1000,
    }),
  });
  global.fetch = async () => ({
    ok: false,
    status: 503,
    statusText: 'Unavailable',
  });
  const warn = console.warn;
  console.warn = () => {};
  try {
    const { loadSiteSettings } = await loadFresh();
    const settings = await loadSiteSettings();
    assert.equal(settings.features.newsletter, true);
    assert.equal(settings.features.darkMode, true, 'defaults still merged on fallback');
  } finally {
    console.warn = warn;
  }
});

test('loadSiteSettings falls back on network throw', async () => {
  global.localStorage = createLocalStorageMock();
  global.fetch = async () => {
    throw new Error('offline');
  };
  const warn = console.warn;
  console.warn = () => {};
  try {
    const { loadSiteSettings } = await loadFresh();
    const settings = await loadSiteSettings();
    assert.equal(settings.features.portfolioTracker, true);
  } finally {
    console.warn = warn;
  }
});

test('applyFeatureFlags hides dark-mode, order-gold, and alerts when disabled', async () => {
  const { themeBtn, alertTab, alertPanel, orderLink, alertLink } = installDom();
  global.localStorage = createLocalStorageMock({
    [CACHE_KEY]: JSON.stringify({
      value: {
        features: { darkMode: false, orderGold: false, priceAlerts: false },
      },
      ts: Date.now(),
    }),
  });
  const { applyFeatureFlags } = await loadFresh();
  await applyFeatureFlags();
  assert.equal(themeBtn.style.display, 'none');
  assert.equal(orderLink.style.display, 'none');
  assert.equal(alertTab.style.display, 'none');
  assert.equal(alertPanel.style.display, 'none');
  assert.equal(alertLink.style.display, 'none');
});

test('applyFeatureFlags leaves controls visible when features stay enabled', async () => {
  const { themeBtn, alertTab, orderLink } = installDom();
  global.localStorage = createLocalStorageMock({
    [CACHE_KEY]: JSON.stringify({
      value: { features: {} },
      ts: Date.now(),
    }),
  });
  const { applyFeatureFlags } = await loadFresh();
  await applyFeatureFlags();
  assert.equal(themeBtn.style.display, '');
  assert.equal(orderLink.style.display, '');
  assert.equal(alertTab.style.display, '');
});
