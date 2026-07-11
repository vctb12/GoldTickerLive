const { test, expect } = require('@playwright/test');

// Regression guard for keyboard access to horizontally scrollable data tables.
//
// axe flagged `scrollable-region-focusable` on all 20 static `.edu-table-wrap`
// containers (14 compare, 4 portfolio, 2 heatmap): the wraps scroll on
// overflow but were not focusable, so keyboard users could not reach clipped
// columns. Fix: every wrap carries `tabindex="0" role="region"` and an
// `aria-labelledby` that resolves to visible localized text (table captions on
// compare/portfolio, section headings on heatmap) — no new strings, bilingual
// for free. The global `:focus-visible` baseline (base.css) supplies the ring.
//
// This spec locks: (1) every wrap on each page is focusable + named, and
// (2) a real keyboard scroll works on an overflowing wrap at 390px, in the
// direction RTL/LTR actually overflows.

const MOBILE = { width: 390, height: 844 };

const PAGES = [
  { path: '/compare.html', wraps: 14 },
  { path: '/portfolio.html', wraps: 4 },
  { path: '/heatmap.html', wraps: 2 },
];

test.describe('Scrollable table keyboard access', () => {
  test.use({ viewport: MOBILE });

  for (const { path, wraps } of PAGES) {
    for (const lang of ['en', 'ar']) {
      test(`${path} [${lang}]: all ${wraps} wraps focusable and named`, async ({ page }) => {
        await page.goto(`${path}${lang === 'ar' ? '?lang=ar' : ''}`);
        if (lang === 'ar') {
          await page.waitForFunction(() => document.documentElement.dir === 'rtl', undefined, {
            timeout: 10000,
          });
        }
        await page.waitForSelector('.edu-table-wrap', { state: 'attached', timeout: 10000 });

        const r = await page.evaluate(() => {
          const list = [...document.querySelectorAll('.edu-table-wrap')];
          const bad = list.filter((w) => {
            const lid = w.getAttribute('aria-labelledby');
            const target = lid && document.getElementById(lid);
            return !(
              w.getAttribute('tabindex') === '0' &&
              w.getAttribute('role') === 'region' &&
              target &&
              target.textContent.trim().length > 0
            );
          });
          return { total: list.length, badCount: bad.length };
        });
        expect(r.total, `${path} wrap count`).toBe(wraps);
        expect(r.badCount, 'wraps missing tabindex/role/resolving label').toBe(0);
      });
    }
  }

  test('keyboard arrow scrolls an overflowing wrap (EN/LTR)', async ({ page }) => {
    await page.goto('/compare.html');
    await page.waitForSelector('.edu-table-wrap', { state: 'attached', timeout: 10000 });
    const focused = await page.evaluate(() => {
      const wrap = [...document.querySelectorAll('.edu-table-wrap')].find(
        (w) => w.offsetParent !== null && w.scrollWidth > w.clientWidth
      );
      if (!wrap) return false;
      wrap.focus();
      return document.activeElement === wrap;
    });
    expect(focused, 'an overflowing wrap must be focusable').toBeTruthy();
    await page.keyboard.press('ArrowRight');
    await expect
      .poll(async () => page.evaluate(() => Math.abs(document.activeElement.scrollLeft)))
      .toBeGreaterThan(0);
  });

  test('keyboard arrow scrolls an overflowing wrap (AR/RTL)', async ({ page }) => {
    await page.goto('/compare.html?lang=ar');
    await page.waitForFunction(() => document.documentElement.dir === 'rtl', undefined, {
      timeout: 10000,
    });
    await page.waitForSelector('.edu-table-wrap', { state: 'attached', timeout: 10000 });
    const focused = await page.evaluate(() => {
      const wrap = [...document.querySelectorAll('.edu-table-wrap')].find(
        (w) => w.offsetParent !== null && w.scrollWidth > w.clientWidth
      );
      if (!wrap) return false;
      wrap.focus();
      return document.activeElement === wrap;
    });
    expect(focused, 'an overflowing wrap must be focusable').toBeTruthy();
    // RTL content overflows toward the left, so ArrowLeft is the scroll key.
    await page.keyboard.press('ArrowLeft');
    await expect
      .poll(async () => page.evaluate(() => Math.abs(document.activeElement.scrollLeft)))
      .toBeGreaterThan(0);
  });
});
