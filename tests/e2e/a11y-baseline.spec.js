// Post-hydration accessibility baseline guard.
//
// Complements the static `scripts/node/check-basic-a11y.js` (which scans source HTML) by asserting
// the same invariants on the LIVE, hydrated DOM — so an a11y regression introduced by client JS
// (an injected button with no accessible name, a second <h1>, a dropped landmark) is caught too.
// A 2026-07-10 browser sweep found the core pages clean on all of these.
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

async function audit(page) {
  return page.evaluate(() => {
    const accessibleName = (el) =>
      (el.textContent || '').trim() ||
      el.getAttribute('aria-label') ||
      el.getAttribute('aria-labelledby') ||
      el.getAttribute('title');
    const namedInput = (el) => {
      if (el.getAttribute('aria-label') || el.getAttribute('aria-labelledby')) return true;
      if (el.getAttribute('placeholder')) return true;
      if (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`)) return true;
      return Boolean(el.closest('label'));
    };
    return {
      h1Count: document.querySelectorAll('h1').length,
      mainCount: document.querySelectorAll('main').length,
      htmlLang: document.documentElement.getAttribute('lang'),
      imgsMissingAlt: [...document.querySelectorAll('img')].filter((i) => !i.hasAttribute('alt'))
        .length,
      buttonsUnnamed: [...document.querySelectorAll('button')].filter((b) => !accessibleName(b))
        .length,
      inputsUnnamed: [
        ...document.querySelectorAll('input:not([type=hidden]),select,textarea'),
      ].filter((el) => !namedInput(el)).length,
    };
  });
}

test.describe('Accessibility baseline (hydrated DOM)', () => {
  for (const path of PAGES) {
    test(`a11y invariants: ${path}`, async ({ page, baseURL }) => {
      await page.goto((baseURL || '') + path, { waitUntil: 'load' });
      await page.waitForTimeout(1200); // let hydration inject nav/footer/controls
      const a = await audit(page);
      expect(a.h1Count, `${path} must have exactly one <h1>`).toBe(1);
      expect(a.mainCount, `${path} must have a <main> landmark`).toBeGreaterThanOrEqual(1);
      expect(a.htmlLang, `${path} must set <html lang>`).toBeTruthy();
      expect(a.imgsMissingAlt, `${path} has <img> without alt`).toBe(0);
      expect(a.buttonsUnnamed, `${path} has <button> with no accessible name`).toBe(0);
      expect(a.inputsUnnamed, `${path} has form control with no accessible name`).toBe(0);
    });
  }
});
