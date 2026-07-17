// Console-Zero gate (Operation Midas, Phase 17).
//
// The permanent regression fence that keeps the production surface silent: for the top pages, in
// BOTH English and Arabic (RTL, `?lang=ar`), the browser console must carry ZERO site-origin error
// messages, ZERO uncaught page errors, and ZERO unhandled promise rejections originating from our
// own code.
//
// Served exactly like the rest of the e2e suite: playwright.config.js's `webServer` runs
// `python3 -m http.server 8080` from the repo root (native-ESM source, baseURL
// http://localhost:8080), which this spec reuses. It adds NO server wiring of its own — it inherits
// whatever tree the shared webServer (or an already-running server on :8080) exposes.
//
// EXTERNAL-ORIGIN ALLOWLIST — why it exists:
//   The page progressively enhances itself with third-party services (live gold/FX prices, OSM map
//   tiles, ads, analytics) that live on other origins and depend on network egress NOT under test.
//   In the sandbox/CI those cross-origin requests can fail or hang; the page has verified fallbacks
//   for every one of them, so their console noise is NOT a first-party defect. We therefore ignore
//   an error ONLY when the URL it is attributed to belongs to one of these external hosts. Any error
//   attributed to our own origin (localhost / a relative `/assets/...` path) still fails the test.
const { test, expect } = require('@playwright/test');

// Clearly-commented allowlist of EXTERNAL origins whose failures are tolerated (host suffix match).
// These are all off-site enhancements with first-party fallbacks — never our own code.
const EXTERNAL_ALLOWLIST = [
  'gold-api.com', // live spot gold price API (api.gold-api.com)
  'er-api.com', // FX rates (open.er-api.com)
  'openstreetmap.org', // OSM raster map tiles (*.tile.openstreetmap.org)
  'openstreetmap.fr', // OSM tile mirror
  'nominatim.org', // OSM geocoding
  'googlesyndication.com', // AdSense
  'googleadservices.com', // Ads
  'doubleclick.net', // Ads
  'google-analytics.com', // Analytics
  'googletagmanager.com', // Analytics / GTM
  'clarity.ms', // Microsoft Clarity analytics tag (www.clarity.ms)
  'mintedmetal.com', // provider bakeoff price source
  'freegoldapi.com', // provider bakeoff price source
  'gdeltproject.org', // GDELT news source (api./blog.gdeltproject.org)
  'supabase.co', // shop_listings backend fetch (bundled directory fallback renders)
  'unpkg.com', // Leaflet map CSS/JS CDN (heatmap/shops maps; graceful fallback)
  'jsdelivr.net', // html2canvas CDN (portfolio image export enhancement)
  'tradingview.com', // TradingView embedded widget (market page)
];

// Top pages under the gate (10 pages x 2 languages = 20 loads — under CI time budget).
const PAGES = [
  '/index.html',
  '/tracker.html',
  '/calculator.html',
  '/compare.html',
  '/heatmap.html',
  '/portfolio.html',
  '/market.html',
  '/shops.html',
  '/methodology.html',
  '/learn.html',
];

const LANGS = [
  { label: 'EN', suffix: '' },
  { label: 'AR', suffix: '?lang=ar' },
];

// True when `url` is attributable to an allowlisted EXTERNAL host. A blank/unknown URL is treated as
// site-origin (NOT allowlisted) so we never silently swallow a first-party error with no location.
function isExternalAllowlisted(url) {
  if (!url) return false;
  let host;
  try {
    host = new URL(url).hostname;
  } catch {
    return false; // relative/opaque -> our origin
  }
  return EXTERNAL_ALLOWLIST.some(
    (h) => host === h || host.endsWith('.' + h) || host === 'www.' + h
  );
}

// A pageerror/rejection has no request URL; attribute it via the stack text. It counts as a
// first-party (failing) error unless the stack references ONLY allowlisted external origins.
function stackIsExternalOnly(text) {
  if (!text) return false;
  const urls = String(text).match(/https?:\/\/[^\s'")]+/g);
  if (!urls || urls.length === 0) return false; // no location -> assume first-party, fail closed
  return urls.every((u) => isExternalAllowlisted(u));
}

async function sweep(page, baseURL, path) {
  const siteErrors = [];

  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const url = msg.location()?.url || '';
    if (isExternalAllowlisted(url)) return;
    siteErrors.push(`console.error @ ${url || '(no url)'}: ${msg.text()}`);
  });

  page.on('pageerror', (err) => {
    const text = err?.stack || String(err);
    if (stackIsExternalOnly(text)) return;
    siteErrors.push(`pageerror: ${err?.message || String(err)}`);
  });

  // Unhandled promise rejections do not surface as pageerror in Chromium — capture them explicitly
  // and stamp each with its originating stack so the same external allowlist can be applied.
  await page.addInitScript(() => {
    window.__consoleZeroRejections = [];
    window.addEventListener('unhandledrejection', (e) => {
      const r = e.reason;
      const stack = (r && (r.stack || r.message)) || String(r);
      window.__consoleZeroRejections.push(String(stack));
    });
  });

  await page.goto((baseURL || '') + path, { waitUntil: 'load', timeout: 20_000 });
  await page.waitForTimeout(1200); // let deferred modules / hydration settle

  const rejections = (await page.evaluate(() => window.__consoleZeroRejections || [])) || [];
  for (const stack of rejections) {
    if (stackIsExternalOnly(stack)) continue;
    siteErrors.push(`unhandledrejection: ${stack.split('\n')[0]}`);
  }

  return siteErrors;
}

test.describe('Console-Zero gate (top pages, EN + AR)', () => {
  for (const path of PAGES) {
    for (const { label, suffix } of LANGS) {
      test(`zero site-origin console errors: ${path} [${label}]`, async ({ page, baseURL }) => {
        const siteErrors = await sweep(page, baseURL, path + suffix);
        expect(
          siteErrors,
          `site-origin console errors on ${path}${suffix} [${label}]:\n  ${siteErrors.join('\n  ')}`
        ).toEqual([]);
      });
    }
  }
});
