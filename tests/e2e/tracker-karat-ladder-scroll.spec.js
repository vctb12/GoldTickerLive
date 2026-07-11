const { test, expect } = require('@playwright/test');

// Regression guard for the mobile karat-ladder clip.
//
// Bug: `.tracker-ladder-table-wrap` declared `overflow: auto` in the shared
// scroll rule but a later block overrode it with `overflow: hidden`, while the
// mobile single-column grid used a bare `1fr` track (= minmax(auto, 1fr)), so
// the 480px-min-width karat table blew the column out past the viewport. Net
// effect at 390px: the vs-24K / day-change columns were clipped with NO scroll
// path anywhere in the ancestor chain — data silently unreachable, invisible
// to document-overflow checks because the page-level clip swallowed it.
//
// This spec locks the fix in both languages: the wrap fits the viewport, is
// horizontally scrollable, and the last column is actually reachable.

const MOBILE = { width: 390, height: 844 };

test.describe('Tracker karat ladder @390px', () => {
  test.use({ viewport: MOBILE });

  for (const lang of ['en', 'ar']) {
    test(`karat columns reachable via wrap scroll [${lang}]`, async ({ page }) => {
      await page.goto(`/tracker.html${lang === 'ar' ? '?lang=ar' : ''}`);
      await page.waitForSelector('body[data-tracker-shell-ready="true"]', { timeout: 15000 });
      if (lang === 'ar') {
        await page.waitForFunction(() => document.documentElement.dir === 'rtl', undefined, {
          timeout: 10000,
        });
      }

      const state = await page.evaluate(() => {
        const wrap = document.querySelector('.tracker-ladder-table-wrap');
        const table = wrap?.querySelector('table');
        if (!wrap || !table) return { found: false };
        const cs = getComputedStyle(wrap);
        const wrapRect = wrap.getBoundingClientRect();
        const cells = table.querySelectorAll('tr:first-child th, tr:first-child td');
        const lastCell = cells[cells.length - 1];
        // Scroll the wrap fully toward the overflow side (RTL scrolls negative).
        wrap.scrollLeft =
          document.documentElement.dir === 'rtl' ? -wrap.scrollWidth : wrap.scrollWidth;
        const after = lastCell.getBoundingClientRect();
        return {
          found: true,
          overflowX: cs.overflowX,
          wrapFitsViewport: wrapRect.left >= -1 && wrapRect.right <= window.innerWidth + 1,
          wrapScrollable: wrap.scrollWidth > wrap.clientWidth,
          lastColReachable: after.left >= -1 && after.right <= window.innerWidth + 1,
          docOverflow: document.documentElement.scrollWidth - window.innerWidth,
        };
      });

      expect(state.found, 'ladder table present').toBeTruthy();
      expect(state.overflowX, 'wrap must scroll, not clip').toBe('auto');
      expect(state.wrapFitsViewport, 'wrap itself must not exceed the viewport').toBeTruthy();
      expect(state.wrapScrollable, 'table wider than wrap → wrap scrolls').toBeTruthy();
      expect(state.lastColReachable, 'last karat column reachable after scroll').toBeTruthy();
      expect(state.docOverflow, 'no document-level overflow').toBeLessThanOrEqual(1);
    });
  }
});
