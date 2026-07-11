const { test, expect } = require('@playwright/test');

// Locks the Arabic/RTL mobile layout against horizontal-overflow regressions.
//
// AGENTS.md: "RTL layouts must work at 360px minimum. Every layout change
// requires RTL spot-check." mobile-smoke.spec.js already guards no-overflow at
// 390px, but almost entirely in the English/LTR default state (only the
// calculator gets a forced-RTL check). This spec extends that guarantee to the
// Arabic first-load path (`?lang=ar`) — the exact URL shape the language
// switcher and hreflang alternates link to — across the core product surfaces,
// so a future CSS/markup change can't reintroduce a bidi overflow on the
// highest-traffic Arabic pages without turning CI red.

const MOBILE_VIEWPORT = { width: 390, height: 844 };

// Core surfaces reachable in Arabic via `?lang=ar`. Kept in sync with the
// English matrix in mobile-smoke.spec.js.
const AR_PAGES = [
  { route: '/index.html?lang=ar', label: 'home' },
  { route: '/tracker.html?lang=ar', label: 'tracker', trackerShell: true },
  { route: '/calculator.html?lang=ar', label: 'calculator' },
  { route: '/shops.html?lang=ar', label: 'shops' },
  { route: '/methodology.html?lang=ar', label: 'methodology' },
  { route: '/compare.html?lang=ar', label: 'compare' },
];

async function expectNoHorizontalOverflow(page, route) {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }));
  expect(
    metrics.scrollWidth <= metrics.viewportWidth + 1,
    `${route} overflows horizontally in RTL: ${metrics.scrollWidth}px > ${metrics.viewportWidth}px`
  ).toBeTruthy();
}

test.describe('Arabic / RTL mobile layout (390px)', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  for (const { route, label, trackerShell } of AR_PAGES) {
    test(`${label} applies RTL and stays overflow-free at 390px`, async ({ page }) => {
      await page.goto(route);

      if (trackerShell) {
        await page.waitForSelector('body[data-tracker-shell-ready="true"]', { timeout: 10000 });
      }

      // Wait for the page's own boot to resolve `?lang=ar` before measuring, so
      // we assert against the settled Arabic layout rather than a pre-hydration
      // English flash.
      await page.waitForFunction(
        () =>
          document.documentElement.getAttribute('dir') === 'rtl' &&
          document.documentElement.lang === 'ar',
        undefined,
        { timeout: 10000 }
      );

      await expect(page.locator('main')).toBeVisible();
      await expectNoHorizontalOverflow(page, route);
    });
  }
});
