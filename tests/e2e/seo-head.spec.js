// Post-hydration SEO-head integrity guard.
//
// Complements the static `scripts/node/check-seo-meta.js` (source-HTML scan) by asserting the SEO
// head is still correct on the LIVE, hydrated DOM — the site is heavily client-hydrated, and a
// regression that double-injected a canonical, blanked the <title>, or dropped an hreflang alternate
// would tank indexing while passing a source scan. A 2026-07-10 sweep found all core pages clean.
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
  '/terms.html',
  '/privacy.html',
];

async function head(page) {
  return page.evaluate(() => ({
    canonicals: [...document.querySelectorAll('link[rel="canonical"]')].map((l) => l.href),
    titleCount: document.querySelectorAll('title').length,
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.content || '',
    hreflangs: [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map((l) => ({
      lang: l.getAttribute('hreflang'),
      href: l.getAttribute('href'),
    })),
  }));
}

test.describe('SEO head integrity (hydrated DOM)', () => {
  for (const path of PAGES) {
    test(`seo head: ${path}`, async ({ page, baseURL }) => {
      await page.goto((baseURL || '') + path, { waitUntil: 'load' });
      await page.waitForTimeout(1200); // allow any head-touching hydration to settle
      const h = await head(page);

      // Exactly one canonical, absolute https.
      expect(h.canonicals.length, `${path} must have exactly one canonical`).toBe(1);
      expect(h.canonicals[0], `${path} canonical must be absolute https`).toMatch(/^https:\/\//);

      // Exactly one non-empty <title>.
      expect(h.titleCount, `${path} must have exactly one <title>`).toBe(1);
      expect(h.title.trim().length, `${path} title must be non-empty`).toBeGreaterThan(0);

      // Meta description present and substantive.
      expect(h.description.trim().length, `${path} needs a meta description`).toBeGreaterThan(20);

      // hreflang alternates: must include en, ar, and x-default, each with an absolute https href.
      const langs = h.hreflangs.map((x) => x.lang);
      for (const required of ['en', 'ar', 'x-default']) {
        expect(langs, `${path} hreflang must include ${required}`).toContain(required);
      }
      for (const alt of h.hreflangs) {
        expect(alt.href, `${path} hreflang[${alt.lang}] href must be absolute https`).toMatch(
          /^https:\/\//
        );
      }
    });
  }
});
