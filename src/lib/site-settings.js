/**
 * lib/site-settings.js
 *
 * Fetches site_settings from Supabase for public pages.
 * Uses the REST API directly (PostgREST) — no SDK required.
 *
 * Settings are cached in localStorage with a 5-minute TTL so every
 * page load does not hit the network. On any failure the module
 * falls back to the cached value, then to hardcoded defaults that
 * match the admin panel's DEFAULTS object.
 *
 * Exports:
 *   getCachedSiteSettings()  — synchronous, returns merged settings
 *   loadSiteSettings()       — async, fetches from Supabase if cache is stale
 *   applyFeatureFlags()      — async, fetches settings then toggles DOM elements
 */

import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config/supabase.js';

// ── Cache config ─────────────────────────────────────────────────────────────
const CACHE_KEY = 'gp_site_settings';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ── Defaults (must stay in sync with admin/settings DEFAULTS.features) ───────
const DEFAULT_FEATURES = {
  darkMode: true,
  newsletter: false,
  portfolioTracker: true,
  orderGold: true,
  priceAlerts: true,
};

/** Merge a (possibly partial) saved value with defaults. */
function merge(saved) {
  if (!saved || typeof saved !== 'object') {
    return { features: { ...DEFAULT_FEATURES } };
  }
  return {
    ...saved,
    features: { ...DEFAULT_FEATURES, ...(saved.features || {}) },
  };
}

// ── Synchronous cache helpers ────────────────────────────────────────────────

/**
 * Read settings from localStorage.  Returns merged settings with defaults,
 * or just defaults if nothing is cached.
 */
export function getCachedSiteSettings() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return merge(null);
    const { value } = JSON.parse(raw);
    return merge(value);
  } catch {
    return merge(null);
  }
}

function isCacheFresh() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return false;
    const { ts } = JSON.parse(raw);
    return Date.now() - ts < CACHE_TTL_MS;
  } catch {
    return false;
  }
}

// ── Async fetch (deduplicated) ───────────────────────────────────────────────

let _fetchPromise = null;

/**
 * Load settings from Supabase.  Returns cached data immediately if the cache
 * is less than 5 minutes old; otherwise fetches from the network and updates
 * the cache.  Concurrent callers share a single in-flight request.
 *
 * @returns {Promise<Object>} Merged settings object.
 */
export async function loadSiteSettings() {
  if (isCacheFresh()) return getCachedSiteSettings();

  // Deduplicate concurrent requests
  if (_fetchPromise) return _fetchPromise;

  _fetchPromise = (async () => {
    try {
      const url = `${SUPABASE_URL}/rest/v1/site_settings?id=eq.default&select=value`;

      const res = await fetch(url, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        console.warn('[site-settings] Fetch failed:', res.status, res.statusText);
        return getCachedSiteSettings();
      }

      const rows = await res.json();
      const value = rows?.[0]?.value || {};

      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ value, ts: Date.now() }));
      } catch {
        /* storage full — continue with in-memory value */
      }

      return merge(value);
    } catch (err) {
      console.warn('[site-settings] Network error:', err.message);
      return getCachedSiteSettings();
    } finally {
      _fetchPromise = null;
    }
  })();

  return _fetchPromise;
}

// ── DOM feature-flag application ─────────────────────────────────────────────

/**
 * Fetch site settings and hide DOM elements whose feature flag is disabled.
 *
 * Designed to be called once after the nav and footer have been injected.
 * Because this is async the microtask boundary ensures synchronous footer
 * injection (which typically follows injectNav) has already completed
 * before we query the DOM.
 *
 * Elements are hidden via `display:none` so screen readers also skip them.
 */
export async function applyFeatureFlags() {
  const settings = await loadSiteSettings();
  const f = settings.features || {};

  // ── Dark-mode toggle ─────────────────────────────────────────────────────
  if (!f.darkMode) {
    const btn = document.getElementById('nav-theme-toggle');
    if (btn) btn.style.display = 'none';
  }

  // ── Order Gold links (nav dropdowns + footer) ────────────────────────────
  if (!f.orderGold) {
    document.querySelectorAll('a[href*="order-gold"]').forEach((el) => {
      el.style.display = 'none';
    });
  }

  // ── Price Alerts (tracker tab + nav/footer links) ────────────────────────
  if (!f.priceAlerts) {
    // Tracker tab button
    const alertTab = document.getElementById('tab-alerts');
    if (alertTab) alertTab.style.display = 'none';

    // Tracker overlay panel
    const alertPanel = document.getElementById('tp-overlay-alerts');
    if (alertPanel) alertPanel.style.display = 'none';

    // Nav/footer links that point to the alerts panel
    document.querySelectorAll('a[href*="panel=alerts"]').forEach((el) => {
      el.style.display = 'none';
    });
  }
}
