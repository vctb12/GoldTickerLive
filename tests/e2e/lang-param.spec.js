// Language-param honoring guard.
//
// The site's Arabic hreflang and its in-page language switcher (see src/lib/page-handoff.js /
// src/lib/cross-page-links.js) link to pages with an explicit `?lang=ar` query param. Every
// localized page must therefore render Arabic (document `dir="rtl"` + `lang="ar"`) on first load
// when `?lang=ar` is present, and stay LTR/English otherwise. A 2026-07-10 sweep found terms,
// privacy, and methodology ignored the param (read only localStorage), so navigating from an Arabic
// page dropped them back to English — fixed by honoring `?lang=` first. This locks that in.
//
// NOTE: tracker.html is intentionally excluded — it carries locale in the URL *hash* (SPA-style
// state), not the query string, and is tracked as a separate finding for careful flagship handling.
const { test, expect } = require('@playwright/test');

const LOCALIZED_PAGES = [
  '/index.html',
  '/calculator.html',
  '/shops.html',
  '/compare.html',
  '/heatmap.html',
  '/learn.html',
  '/glossary.html',
  '/portfolio.html',
  '/market.html',
  '/dubai-gold-price.html',
  '/terms.html',
  '/privacy.html',
  '/methodology.html',
];

async function docLocale(page) {
  return page.evaluate(() => ({
    dir: document.documentElement.getAttribute('dir'),
    lang: document.documentElement.getAttribute('lang'),
  }));
}

test.describe('Language param: ?lang=ar renders Arabic RTL on first load', () => {
  for (const path of LOCALIZED_PAGES) {
    test(`?lang=ar → rtl/ar: ${path}`, async ({ page, baseURL }) => {
      await page.goto((baseURL || '') + path + '?lang=ar', { waitUntil: 'load' });
      await page.waitForTimeout(1200); // allow shell hydration / lang boot
      const { dir, lang } = await docLocale(page);
      expect(dir, `${path}?lang=ar should be RTL`).toBe('rtl');
      expect(lang, `${path}?lang=ar should be lang=ar`).toBe('ar');
    });
  }

  for (const path of LOCALIZED_PAGES) {
    test(`?lang=en → ltr/en: ${path}`, async ({ page, baseURL }) => {
      await page.goto((baseURL || '') + path + '?lang=en', { waitUntil: 'load' });
      await page.waitForTimeout(1200);
      const { dir, lang } = await docLocale(page);
      expect(dir, `${path}?lang=en should be LTR`).toBe('ltr');
      expect(lang, `${path}?lang=en should be lang=en`).toBe('en');
    });
  }
});
