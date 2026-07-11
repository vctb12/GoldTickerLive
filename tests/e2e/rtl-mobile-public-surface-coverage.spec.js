const { test, expect } = require('@playwright/test');

// Arabic / RTL mobile regression coverage for the PUBLIC page families NOT covered
// by tests/e2e/rtl-mobile-overflow.spec.js (which locks the six core surfaces:
// home, tracker, calculator, shops, methodology, compare).
//
// Together the two specs make "RTL layout integrity at mobile width" a durable CI
// invariant across the whole public product. AGENTS.md: "RTL layouts must work at
// 360px minimum. Every layout change requires RTL spot-check."
//
// Each surface is loaded via its Arabic first-load path (`?lang=ar` — the exact URL
// shape the language switcher and hreflang alternates link to) and asserted for:
//   1. settled RTL   (documentElement dir=rtl, lang=ar)
//   2. shared shell mounted (nav + <main>)
//   3. NO document-level horizontal overflow (robust detector below)
//   4. RTL-context a11y smoke (one <main>, one <h1>, no unnamed <button>)
//   5. no uncaught page error
//
// EXCLUDED — offline.html: it is the service-worker offline fallback, a static page
// with NO ES-module shell boot (it must render with no network / no modules). It ships
// bilingual-static content and hardcodes `<html lang="en" dir="ltr">`, so it does not
// (and should not) respond to the `?lang=ar` runtime boot. Excluding it is intentional,
// not a masked defect. Country/city pages are also absent (removed in the 2026-07-04 IA
// reset), so there is no template family to sample.

const MOBILE = { width: 390, height: 844 };
const NARROW = { width: 320, height: 844 };

// Widths: 390 broadly; 320 additionally for the data/interaction-dense surfaces most
// likely to overflow (tables/cards, charts, maps, filter bars, dense indexes).
const AR_SURFACES = [
  { name: 'learn-hub', path: '/learn.html', widths: [MOBILE] },
  { name: 'glossary', path: '/glossary.html', widths: [MOBILE, NARROW] },
  { name: 'market', path: '/market.html', widths: [MOBILE, NARROW] },
  { name: 'heatmap', path: '/heatmap.html', widths: [MOBILE, NARROW] },
  { name: 'portfolio', path: '/portfolio.html', widths: [MOBILE, NARROW] },
  { name: 'dubai-landing', path: '/dubai-gold-price.html', widths: [MOBILE, NARROW] },
  { name: 'privacy', path: '/privacy.html', widths: [MOBILE] },
  { name: 'terms', path: '/terms.html', widths: [MOBILE] },
  { name: 'not-found', path: '/404.html', widths: [MOBILE] },
];

// Robust horizontal-overflow detector. A bare scrollWidth check reports THAT the page
// overflows; this also reports WHICH element causes it, while deliberately ignoring
// legitimate horizontal scroll containers (overflow-x: auto/scroll — e.g. responsive
// tables, carousels, code blocks) and fixed-position chrome. Runs in-page.
async function detectOverflow(page) {
  return page.evaluate(() => {
    const de = document.documentElement;
    const vw = window.innerWidth;
    const docOverflow = de.scrollWidth - vw;
    const offenders = [];
    if (docOverflow > 1) {
      for (const el of document.body.querySelectorAll('*')) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        const s = getComputedStyle(el);
        if (s.visibility === 'hidden' || s.display === 'none' || s.opacity === '0') continue;
        if (s.position === 'fixed') continue; // fixed chrome does not scroll the document
        const over = Math.max(r.right - vw, -r.left); // beyond right edge (LTR) or left edge (RTL)
        if (over <= 1) continue;
        let anc = el.parentElement;
        let inApprovedScroll = false;
        while (anc && anc !== document.body) {
          const ox = getComputedStyle(anc).overflowX;
          if (ox === 'auto' || ox === 'scroll') {
            inApprovedScroll = true;
            break;
          }
          anc = anc.parentElement;
        }
        if (inApprovedScroll) continue;
        offenders.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || '',
          cls: (el.className && el.className.toString ? el.className.toString() : '').slice(0, 60),
          over: Math.round(over),
          text: (el.textContent || '').trim().slice(0, 40),
        });
        if (offenders.length >= 5) break;
      }
    }
    return { docOverflow, offenders };
  });
}

async function a11ySmoke(page) {
  return page.evaluate(() => {
    const accessibleName = (el) =>
      (el.textContent || '').trim() ||
      el.getAttribute('aria-label') ||
      el.getAttribute('aria-labelledby') ||
      el.getAttribute('title');
    return {
      h1Count: document.querySelectorAll('h1').length,
      mainCount: document.querySelectorAll('main').length,
      buttonsUnnamed: [...document.querySelectorAll('button')].filter((b) => !accessibleName(b))
        .length,
    };
  });
}

// Waits for the page's own ?lang=ar boot + shared-shell mount to settle, so assertions
// run against the final Arabic layout rather than a pre-hydration English flash.
async function gotoArabic(page, path) {
  await page.goto(`${path}?lang=ar`);
  await page.waitForFunction(
    () =>
      document.documentElement.getAttribute('dir') === 'rtl' &&
      document.documentElement.lang === 'ar' &&
      !!document.querySelector('main') &&
      !!document.querySelector('.site-nav'),
    undefined,
    { timeout: 15000 }
  );
}

test.describe('Arabic / RTL mobile public-surface coverage', () => {
  for (const surface of AR_SURFACES) {
    for (const vp of surface.widths) {
      test(`${surface.name} @${vp.width}px: RTL, overflow-free, a11y-clean`, async ({ page }) => {
        await page.setViewportSize(vp);
        const pageErrors = [];
        page.on('pageerror', (e) => pageErrors.push(String(e)));

        await gotoArabic(page, surface.path);
        await expect(page.locator('main')).toBeVisible();

        const dir = await page.evaluate(() => document.documentElement.getAttribute('dir'));
        const lang = await page.evaluate(() => document.documentElement.lang);
        expect(dir, `${surface.name} must be RTL`).toBe('rtl');
        expect(lang, `${surface.name} must be lang=ar`).toBe('ar');

        const { docOverflow, offenders } = await detectOverflow(page);
        expect(
          offenders,
          `${surface.name} @${vp.width}px has RTL overflow (docOverflow=${docOverflow}px): ` +
            JSON.stringify(offenders)
        ).toEqual([]);
        expect(docOverflow, `${surface.name} @${vp.width}px document overflow`).toBeLessThanOrEqual(
          1
        );

        const a = await a11ySmoke(page);
        expect(a.mainCount, `${surface.name} exactly one <main>`).toBe(1);
        expect(a.h1Count, `${surface.name} exactly one <h1>`).toBe(1);
        expect(a.buttonsUnnamed, `${surface.name} unnamed <button> count`).toBe(0);

        expect(pageErrors, `${surface.name} uncaught page errors`).toEqual([]);
      });
    }
  }

  // Global search overlay is part of the shared shell — verify it in Arabic at mobile
  // width once (representative page). Covers focus management, Arabic input, results,
  // Escape-to-close, focus return, and no overflow while open.
  test('global search overlay works in Arabic on mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await gotoArabic(page, '/market.html');

    const trigger = page.locator('#nav-search-btn');
    const overlay = page.locator('#nav-search-overlay');
    const input = page.locator('#nav-search-input');

    await expect(trigger).toBeVisible();
    await trigger.click();
    await expect(overlay).toBeVisible();
    await expect(input).toBeFocused();

    await input.fill('ذهب'); // "gold" in Arabic
    // Either results or a valid empty-state message must render (never a silent blank).
    await expect
      .poll(async () =>
        page.evaluate(
          () =>
            document.querySelectorAll('.nav-search-result, [id^="nav-search-result"]').length > 0 ||
            document.querySelector('#nav-search-message')?.offsetParent != null
        )
      )
      .toBe(true);

    const { docOverflow } = await detectOverflow(page);
    expect(docOverflow, 'no overflow while search overlay open').toBeLessThanOrEqual(1);

    await page.keyboard.press('Escape');
    await expect(overlay).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  // Mobile navigation drawer must open/close correctly in RTL without stuck scroll lock.
  test('mobile nav drawer opens and closes in Arabic (RTL)', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await gotoArabic(page, '/glossary.html');

    const burger = page.locator('#nav-hamburger');
    const drawer = page.locator('#nav-drawer');
    await expect(burger).toBeVisible();
    await expect(burger).toHaveAttribute('aria-expanded', 'false');

    await burger.click();
    await expect(burger).toHaveAttribute('aria-expanded', 'true');
    await expect(drawer).toHaveAttribute('aria-hidden', 'false');
    const openOverflow = await detectOverflow(page);
    expect(openOverflow.docOverflow, 'no overflow with RTL drawer open').toBeLessThanOrEqual(1);

    await page.keyboard.press('Escape');
    await expect(burger).toHaveAttribute('aria-expanded', 'false');
    await expect(drawer).toHaveAttribute('aria-hidden', 'true');
    await expect.poll(async () => page.evaluate(() => document.body.style.overflow)).toBe('');
  });
});
