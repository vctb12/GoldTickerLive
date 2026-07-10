// Console/first-party-network cleanliness regression guard.
//
// A full-site sweep (2026-07-10) found the public pages load with zero console errors from our own
// code. The failures that DO appear are all third-party progressive enhancements the page handles
// gracefully (Google Analytics beacons; the cross-origin Supabase `shop_listings` fetch, after which
// shops still renders its bundled directory). This spec locks that in:
//
//   • ZERO uncaught page errors (our JS must never throw) on any covered page, and
//   • ZERO failed **same-origin** responses (no broken local asset/module/link),
//   while cross-origin third-party failures (analytics, supabase.co, fx/gold APIs) are tolerated —
//   they are enhancements with verified fallbacks, not first-party breakage.
//
// Served like the rest of the e2e suite (`python3 -m http.server` at repo root; native-ESM source).
const { test, expect } = require('@playwright/test');

const PAGES = [
  '/index.html',
  '/calculator.html',
  '/tracker.html',
  '/shops.html',
  '/compare.html',
  '/heatmap.html',
  '/learn.html',
  '/glossary.html',
  '/methodology.html',
  '/portfolio.html',
  '/market.html',
  '/dubai-gold-price.html',
];

// Also exercise the Arabic (RTL) render path for a representative subset.
const AR_PAGES = ['/index.html', '/learn.html', '/shops.html'];

function sameOrigin(url, baseURL) {
  try {
    return new URL(url).host === new URL(baseURL).host;
  } catch {
    return false;
  }
}

async function sweep(page, baseURL, url) {
  const pageErrors = [];
  const sameOriginFailures = [];
  page.on('pageerror', (err) => pageErrors.push(String(err)));
  page.on('response', (res) => {
    if (res.status() >= 400 && sameOrigin(res.url(), baseURL)) {
      sameOriginFailures.push(`HTTP ${res.status()} ${res.url()}`);
    }
  });
  page.on('requestfailed', (req) => {
    const f = req.failure()?.errorText || 'failed';
    // net::ERR_ABORTED is how the headless browser drops in-flight analytics beacons — ignore
    // cross-origin, only flag first-party request failures.
    if (sameOrigin(req.url(), baseURL) && !/ERR_ABORTED/.test(f)) {
      sameOriginFailures.push(`${f} ${req.url()}`);
    }
  });

  // `load` (not networkidle) — analytics/price beacons keep the network busy indefinitely.
  await page.goto((baseURL || '') + url, { waitUntil: 'load', timeout: 20_000 });
  await page.waitForTimeout(1200); // let deferred hydration/modules run
  return { pageErrors, sameOriginFailures };
}

test.describe('Console/network cleanliness (first-party)', () => {
  for (const path of PAGES) {
    test(`no first-party console/network errors: ${path}`, async ({ page, baseURL }) => {
      const { pageErrors, sameOriginFailures } = await sweep(page, baseURL, path);
      expect(pageErrors, `uncaught JS on ${path}: ${pageErrors.join(' | ')}`).toEqual([]);
      expect(
        sameOriginFailures,
        `first-party 4xx/failed on ${path}: ${sameOriginFailures.join(' | ')}`
      ).toEqual([]);
    });
  }

  for (const path of AR_PAGES) {
    test(`no first-party console/network errors (AR/RTL): ${path}`, async ({ page, baseURL }) => {
      const { pageErrors, sameOriginFailures } = await sweep(page, baseURL, path + '?lang=ar');
      expect(pageErrors, `uncaught JS on ${path}?lang=ar: ${pageErrors.join(' | ')}`).toEqual([]);
      expect(
        sameOriginFailures,
        `first-party 4xx/failed on ${path}?lang=ar: ${sameOriginFailures.join(' | ')}`
      ).toEqual([]);
    });
  }
});
