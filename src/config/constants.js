// BASE_PATH: the root path under which the site is served.
// '/' for custom domain (goldtickerlive.com) or Replit; '/Gold-Prices/' for GitHub Pages sub-path.
// Must match vite.config.js `base` and the service worker scope.
export const BASE_PATH = '/';

// Vite replaces these at build time. Only the public API origin is embedded in
// the browser bundle; provider credentials remain server-side. Leaving the
// origin empty preserves the static GitHub Pages fallback.
const API_BASE_URL = String(import.meta.env?.VITE_API_BASE_URL || '')
  .trim()
  .replace(/\/+$/, '');
const API_BACKEND_ENABLED =
  import.meta.env?.VITE_API_BACKEND_ENABLED === 'true' || Boolean(API_BASE_URL);
const apiEndpoint = (path) => `${API_BASE_URL}${path}`;

export const CONSTANTS = {
  API_GOLD_URL: '/data/gold_price.json',
  API_BASE_URL,
  API_LATEST_URL: apiEndpoint('/api/v1/prices/live'),
  API_STREAM_URL: apiEndpoint('/api/v1/prices/stream'),
  API_FX_URL: 'https://open.er-api.com/v6/latest/USD',
  AED_PEG: 3.6725,
  TROY_OZ_GRAMS: 31.1035,
  GOLD_REFRESH_MS: 90000,
  GOLD_FETCH_TIMEOUT: 8000,
  FX_FETCH_TIMEOUT: 8000,
  HISTORY_DAYS: 90,

  // ── Integration flags ───────────────────────────────────────────────────────
  // Static GitHub Pages uses the committed JSON fallback. When a public runtime
  // origin is supplied, REST/SSE requests use that origin and retain the static
  // fallback if the runtime is unavailable.
  // Gates the backend price probe and the server-alerts capability probe so
  // neither makes a request unless the runtime path is configured.
  API_BACKEND_ENABLED,

  // Client analytics are mirrored to the Supabase `analytics_events` table with
  // the public anon key. That write returns 401 until an RLS policy grants the
  // `anon` role INSERT (see PR notes and `docs/ANALYTICS_EVENTS.md`). Leave
  // false so no request is sent at all — GA4 still receives every event via the
  // gtag path. Flip to true only after the anon-insert RLS policy is live in
  // the Supabase dashboard.
  ANALYTICS_SUPABASE_ENABLED: false,

  CACHE_KEYS: {
    goldPrice: 'gold_price_cache',
    goldFallback: 'gold_price_fallback',
    fxRates: 'fx_rates_cache',
    fxFallback: 'fx_rates_fallback',
    dayOpen: 'gold_day_open',
    history: 'gold_price_history',
    userPrefs: 'user_prefs',
    alerts: 'gold_price_alerts',
  },
};

// ── Ad monetization config ──────────────────────────────────────────────────
// Fill in after Google AdSense approval. Leave empty to silently hide all ads.
export const AD_CONFIG = {
  ADSENSE_PUBLISHER_ID: '', // e.g. 'ca-pub-1234567890'
  SLOT_GOVERNANCE: {
    maxSlotsPerPage: 3,
    allowLeaderboardOnMobile: false,
    requiredSlotId: true,
    minDistanceRule: 'Avoid placing ad slots back-to-back without meaningful content between them.',
  },
  AD_SLOTS: {
    homeLeaderboard: '', // 728x90 below hero
    homeRectangle: '', // 300x250 in tool cards sidebar
    trackerSidebar: '', // 300x250 sticky sidebar
    calculatorResult: '', // 300x250 below results
    countryBanner: '', // 728x90 above FAQ
    learnRectangle: '', // 300x250 after 3rd section
    toolBanner: '', // 728x90 bottom of tool pages
    guideMidContent: '', // 300x250 after 2nd section
  },
};

// ── Newsletter ──────────────────────────────────────────────────────────────
// Newsletter subscription endpoint. Uses the internal API by default.
// Set FORMSPREE_ENDPOINT to use Formspree as a fallback (legacy).
export const NEWSLETTER_API_ENDPOINT = '/api/v1/newsletter/subscribe';
export const FORMSPREE_ENDPOINT = ''; // legacy — leave empty to use NEWSLETTER_API_ENDPOINT
