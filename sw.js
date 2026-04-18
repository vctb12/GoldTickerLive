/**
 * GoldPrices Service Worker
 * Strategy: cache-first for static assets, network-first for API calls.
 *
 * Deployment base path: '/' (custom domain goldtickerlive.com).
 */

const CACHE_NAME = 'goldprices-v14';
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 1 day

// Static assets to pre-cache on install - MUST use / prefix for GitHub Pages
const PRECACHE_URLS = [
  '/',
  '/tracker.html',
  '/shops.html',
  '/calculator.html',
  '/learn.html',
  '/insights.html',
  '/methodology.html',
  '/invest.html',
  '/countries/index.html',
  // Country pages (now at countries/{slug}/index.html)
  '/countries/uae/',
  '/countries/saudi-arabia/',
  '/countries/kuwait/',
  '/countries/qatar/',
  '/countries/bahrain/',
  '/countries/oman/',
  '/countries/egypt/',
  '/countries/jordan/',
  '/countries/morocco/',
  '/countries/india/',
  '/countries/lebanon/',
  '/countries/tunisia/',
  '/countries/algeria/',
  '/countries/libya/',
  '/countries/sudan/',
  '/countries/iraq/',
  '/countries/syria/',
  '/countries/palestine/',
  '/countries/yemen/',
  '/countries/turkey/',
  '/countries/pakistan/',
  // Guides
  '/content/guides/buying-guide.html',
  // Tool pages
  '/content/gold-price-history/',
  '/content/order-gold/',
  '/content/social/x-post-generator.html',
  '/content/search/',
  '/content/tools/weight-converter.html',
  '/content/tools/zakat-calculator.html',
  '/content/tools/investment-return.html',
  // City pages
  '/countries/uae/cities/dubai.html',
  '/countries/uae/cities/abu-dhabi.html',
  '/countries/saudi-arabia/cities/riyadh.html',
  '/countries/egypt/cities/cairo.html',
  '/countries/qatar/cities/doha.html',
  // Market pages
  '/countries/uae/markets/dubai-gold-souk.html',
  '/countries/egypt/markets/khan-el-khalili-cairo.html',
  // Key leaf pages (now under countries/)
  '/countries/uae/gold-price/',
  '/countries/uae/dubai/gold-prices/',
  '/countries/uae/dubai/gold-rate/24-karat/',
  '/countries/uae/dubai/gold-rate/22-karat/',
  '/countries/uae/dubai/gold-rate/21-karat/',
  '/countries/uae/dubai/gold-rate/18-karat/',
  '/countries/uae/abu-dhabi/gold-prices/',
  '/countries/uae/sharjah/gold-prices/',
  // Offline fallback
  '/offline.html',
];

// External origins that should bypass the cache (live data APIs)
const BYPASS_ORIGINS = ['gold-api.com', 'open.er-api.com'];

// ─────────────────────────────────────────────────────────────────────────────
// INSTALL — pre-cache static shell
// ─────────────────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        cache.addAll(PRECACHE_URLS).catch((err) => {
          // Don't fail install if some assets are missing (dev environment)
          console.warn('[SW] Pre-cache partial failure:', err.message);
        })
      )
      .then(() => self.skipWaiting())
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVATE — clean up old caches
// ─────────────────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

// Allow clients to trigger an update (e.g., from the page when a new SW is available)
self.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// FETCH — routing strategy
// ─────────────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Always bypass for non-GET or external API calls
  if (request.method !== 'GET') return;
  if (BYPASS_ORIGINS.some((o) => url.hostname.includes(o))) return;
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
    const offlinePage = await caches.match('/offline.html');
    if (offlinePage) return offlinePage;
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
  fetch(request)
    .then((response) => {
      if (response.ok) {
        caches.open(CACHE_NAME).then((cache) => cache.put(request, response));
      }
    })
    .catch(() => {});
}

function shouldCacheRequest(request, url) {
  // Only cache same-origin static assets to avoid opaque/cache-bloat issues.
  if (url.origin !== self.location.origin) return false;

  // Query-param requests can explode cache cardinality; skip.
  if (url.search) return false;

  const cacheableDestinations = new Set(['style', 'script', 'image', 'font', 'manifest']);
  return cacheableDestinations.has(request.destination);
}
