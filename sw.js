/**
 * GoldPrices Service Worker
 * Strategy: cache-first for static assets, network-first for API calls.
 */

const CACHE_NAME = 'goldprices-v4';
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 1 day

// Static assets to pre-cache on install
const PRECACHE_URLS = [
  '/Gold-Prices/',
  // NOTE: Do NOT add /Gold-Prices/index.html separately — GitHub Pages serves
  // the same file for both / and /index.html, but the SW would cache them as
  // two independent entries that can diverge across deploys. Keep only one.
  '/Gold-Prices/tracker.html',
  '/Gold-Prices/shops.html',
  '/Gold-Prices/calculator.html',
  '/Gold-Prices/learn.html',
  '/Gold-Prices/insights.html',
  '/Gold-Prices/methodology.html',
  '/Gold-Prices/style.css',
  '/Gold-Prices/home.css',
  '/Gold-Prices/home.js',
  '/Gold-Prices/tracker-pro.js',
  '/Gold-Prices/tracker-pro.css',
  '/Gold-Prices/shops.js',
  '/Gold-Prices/shops.css',
  '/Gold-Prices/calculator.js',
  '/Gold-Prices/calculator.css',
  '/Gold-Prices/learn.js',
  '/Gold-Prices/learn.css',
  '/Gold-Prices/insights.js',
  '/Gold-Prices/insights.css',
  '/Gold-Prices/methodology.js',
  '/Gold-Prices/methodology.css',
  '/Gold-Prices/favicon.svg',
  '/Gold-Prices/manifest.json',
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
    const shell = await caches.match('/Gold-Prices/');
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
