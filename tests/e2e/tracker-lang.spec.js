// Tracker language-param guard (companion to lang-param.spec.js, which covers the simpler pages).
//
// tracker.html carries most of its state in the URL *hash* (SPA-style), and until this fix its
// initial locale came only from saved state / preference — so a first load via the query param
// `tracker.html?lang=ar` (which the site's Arabic hreflang and in-page switcher generate) stayed
// English/LTR. This asserts the flagship now honors `?lang=` on first load, without disturbing the
// hash deep-link path.
const { test, expect } = require('@playwright/test');

async function docLocale(page) {
  return page.evaluate(() => ({
    dir: document.documentElement.getAttribute('dir'),
    lang: document.documentElement.getAttribute('lang'),
  }));
}

const CASES = [
  { url: '/tracker.html?lang=ar', dir: 'rtl', lang: 'ar' },
  { url: '/tracker.html?lang=en', dir: 'ltr', lang: 'en' },
  { url: '/tracker.html', dir: 'ltr', lang: 'en' },
  // Query lang + hash deep-link together must still render Arabic RTL.
  { url: '/tracker.html?lang=ar#live', dir: 'rtl', lang: 'ar' },
];

test.describe('Tracker honors ?lang= on first load', () => {
  for (const { url, dir, lang } of CASES) {
    test(`${url} → ${dir}/${lang}`, async ({ page, baseURL }) => {
      await page.goto((baseURL || '') + url, { waitUntil: 'load' });
      await page.waitForTimeout(1500); // tracker lazy-loads render/shell modules
      const doc = await docLocale(page);
      expect(doc.dir, `${url} should be ${dir}`).toBe(dir);
      expect(doc.lang, `${url} should be lang=${lang}`).toBe(lang);
    });
  }
});
