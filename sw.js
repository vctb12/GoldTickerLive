/**
 * GoldPrices Service Worker
 * Strategy: cache-first for static assets, network-first for API calls.
 *
 * Deployment base path: '/Gold-Prices/' (GitHub Pages project site).
 * All precache URLs must include the /Gold-Prices/ prefix.
 */

const CACHE_NAME = 'goldprices-v7';
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 1 day

// Static assets to pre-cache on install - MUST use /Gold-Prices/ prefix for GitHub Pages
const PRECACHE_URLS = [
  '/Gold-Prices/',
  '/Gold-Prices/tracker.html',
  '/Gold-Prices/shops.html',
  '/Gold-Prices/calculator.html',
  '/Gold-Prices/learn.html',
  '/Gold-Prices/insights.html',
  '/Gold-Prices/methodology.html',
  '/Gold-Prices/invest.html',
  '/Gold-Prices/countries/index.html',
  '/Gold-Prices/countries/uae.html',
  '/Gold-Prices/countries/saudi-arabia.html',
  '/Gold-Prices/countries/kuwait.html',
  '/Gold-Prices/countries/qatar.html',
  '/Gold-Prices/countries/bahrain.html',
  '/Gold-Prices/countries/oman.html',
  '/Gold-Prices/countries/egypt.html',
  '/Gold-Prices/countries/jordan.html',
  '/Gold-Prices/countries/morocco.html',
  '/Gold-Prices/countries/india.html',
  '/Gold-Prices/guides/buying-guide.html',
  '/Gold-Prices/countries/lebanon.html',
  '/Gold-Prices/countries/tunisia.html',
  '/Gold-Prices/countries/algeria.html',
  '/Gold-Prices/countries/libya.html',
  '/Gold-Prices/countries/sudan.html',
];

// External origins that should bypass the cache (live data APIs)
const BYPASS_ORIGINS = [
  'gold-api.com',
  'open.er-api.com',
];

// ─────────────────────────────────────────────────────────────────────────────
// INSTALL — pre-cache static shell
// ─────────────────────────────────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(PRECACHE_URLS).catch(err => {
        // Don't fail install if some assets are missing (dev environment)
        console.warn('[SW] Pre-cache partial failure:', err.message);
      })
    ).then(() => self.skipWaiting())
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVATE — clean up old caches
// ─────────────────────────────────────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// FETCH — routing strategy
// ─────────────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Always bypass for non-GET or external API calls
  if (request.method !== 'GET') return;
  if (BYPASS_ORIGINS.some(o => url.hostname.includes(o))) return;
  // Bypass chrome-extension and non-http(s) schemes
  if (!url.protocol.startsWith('http')) return;

  // Network-first for navigation (HTML pages) — ensures fresh content
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithFallback(request));
    return;
  }

  // For non-cacheable requests, use plain network fetch.
  if (!shouldCacheRequest(request, url)) {
    event.respondWith(fetch(request));
    return;
  }

  // Cache-first for static assets (JS, CSS, images, fonts)
  event.respondWith(cacheFirstWithUpdate(request));
});

// ─────────────────────────────────────────────────────────────────────────────
// STRATEGIES
// ─────────────────────────────────────────────────────────────────────────────

async function networkFirstWithFallback(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    // Resilient offline fallback for navigation
    const shell = await caches.match('/');
    if (shell) return shell;

    return new Response('Offline — cached version unavailable.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

async function cacheFirstWithUpdate(request) {
  const cached = await caches.match(request);
  if (cached) {
    // Serve from cache immediately, update in background
    fetchAndCache(request);
    return cached;
  }
  // No cache hit — fetch from network
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('', { status: 503 });
  }
}

function fetchAndCache(request) {
  fetch(request).then(response => {
    if (response.ok) {
      caches.open(CACHE_NAME).then(cache => cache.put(request, response));
    }
  }).catch(() => {});
}

function shouldCacheRequest(request, url) {
  // Only cache same-origin static assets to avoid opaque/cache-bloat issues.
  if (url.origin !== self.location.origin) return false;

  // Query-param requests can explode cache cardinality; skip.
  if (url.search) return false;

  const cacheableDestinations = new Set([
    'style',
    'script',
    'image',
    'font',
    'manifest',
  ]);
  return cacheableDestinations.has(request.destination);
}
