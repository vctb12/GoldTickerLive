const { test, expect } = require('@playwright/test');

// Regression guards for two small bilingual-correctness defects.
//
// 1. tracker.html: the #tp-jump-chart button ("View chart") scrolls DOWN the
//    page in both languages, but the boot-time copy rewrite mirrored its arrow
//    to '←' for Arabic. Vertical directions never mirror in RTL — the arrow
//    must be '↓' in both locales.
//
// 2. market.html: the footer disclaimer was a bare English <p> with no lang
//    attribute and no Arabic twin, on a page whose bilingual pattern is twin
//    data-lang-block="en" / data-lang-block="ar" blocks toggled purely by CSS
//    on html[lang]. This locks the twin-block structure and the CSS flip.
//
// External APIs are unreachable in CI/sandbox runs; nothing below depends on
// live network data — only static markup and the boot-time copy rewrite.

const AR_JUMP_LABEL = 'عرض الرسم — الانتقال إلى الرسم البياني المباشر';
const EN_JUMP_LABEL = 'View chart — jump to the live price chart';

// The tracker boot rewrites #tp-jump-chart via replaceChildren(text, ' ', span),
// so after the rewrite the arrow <span> is the link's LAST child node (the
// static HTML keeps a trailing whitespace text node instead). Waiting on that
// plus the localized aria-label observes the rewrite itself — no arbitrary sleeps.
async function waitForJumpChartRewrite(page, expectedLabel) {
  await page.waitForFunction(
    (label) => {
      const btn = document.getElementById('tp-jump-chart');
      if (!btn) return false;
      const last = btn.lastChild;
      if (!last || last.nodeType !== 1 || last.tagName !== 'SPAN') return false;
      return btn.getAttribute('aria-label') === label;
    },
    expectedLabel,
    { timeout: 15000 }
  );
}

async function readJumpArrow(page) {
  return page.evaluate(() => {
    const btn = document.getElementById('tp-jump-chart');
    const span = btn && btn.querySelector('span[aria-hidden="true"]');
    return span ? span.textContent : null;
  });
}

test.describe('Tracker jump-to-chart arrow is vertical in both languages', () => {
  test('tracker.html?lang=ar: arrow is ↓, not a mirrored ←', async ({ page }) => {
    await page.goto('/tracker.html?lang=ar');
    // Wait for the tracker boot to rewrite the button with the Arabic label.
    await waitForJumpChartRewrite(page, AR_JUMP_LABEL);
    const arrow = await readJumpArrow(page);
    expect(arrow, 'AR arrow must not be the horizontal RTL mirror').not.toBe('←');
    expect(arrow, 'link scrolls down the page, so the arrow is ↓').toBe('↓');
  });

  test('tracker.html (EN default): arrow is ↓', async ({ page }) => {
    await page.goto('/tracker.html');
    await waitForJumpChartRewrite(page, EN_JUMP_LABEL);
    const arrow = await readJumpArrow(page);
    expect(arrow).toBe('↓');
  });
});

test.describe('Market disclaimer twin data-lang blocks', () => {
  const readBlocks = (page) =>
    page.evaluate(() => {
      const en = document.querySelector('.mkt-foot .mkt-disclaimer[data-lang-block="en"]');
      const ar = document.querySelector('.mkt-foot .mkt-disclaimer[data-lang-block="ar"]');
      return {
        enExists: !!en,
        arExists: !!ar,
        arLang: ar ? ar.getAttribute('lang') : null,
        arDir: ar ? ar.getAttribute('dir') : null,
        enText: en ? en.textContent.trim() : '',
        arText: ar ? ar.textContent.trim() : '',
        enVisible: !!en && en.offsetParent !== null,
        arVisible: !!ar && ar.offsetParent !== null,
        enDisplay: en ? getComputedStyle(en).display : null,
        arDisplay: ar ? getComputedStyle(ar).display : null,
      };
    });

  test('market.html (default EN): both twins present, EN visible, AR hidden', async ({ page }) => {
    await page.goto('/market.html');
    // The AR twin is display:none by default — wait for attachment, not visibility.
    await page.waitForSelector('.mkt-foot .mkt-disclaimer[data-lang-block="ar"]', {
      state: 'attached',
      timeout: 10000,
    });
    const r = await readBlocks(page);
    expect(r.enExists, 'EN disclaimer twin must exist').toBeTruthy();
    expect(r.arExists, 'AR disclaimer twin must exist').toBeTruthy();
    expect(r.arLang, 'AR twin carries lang="ar"').toBe('ar');
    expect(r.arDir, 'AR twin carries dir="rtl"').toBe('rtl');
    expect(r.enText).toContain('not financial advice');
    expect(r.arText).toContain('ليست نصيحة مالية');
    expect(r.arText).toContain('السعر المرجعي');
    expect(r.enVisible, 'EN twin visible on the English page').toBeTruthy();
    expect(r.arDisplay, 'AR twin hidden on the English page').toBe('none');
    expect(r.arVisible).toBeFalsy();
  });

  test('market.html?lang=ar: AR twin visible, EN hidden', async ({ page }) => {
    await page.goto('/market.html?lang=ar');
    await page.waitForFunction(() => document.documentElement.lang === 'ar', undefined, {
      timeout: 10000,
    });
    await page.waitForSelector('.mkt-foot .mkt-disclaimer[data-lang-block="en"]', {
      state: 'attached',
      timeout: 10000,
    });
    const r = await readBlocks(page);
    expect(r.enExists).toBeTruthy();
    expect(r.arExists).toBeTruthy();
    expect(r.arVisible, 'AR twin visible on the Arabic page').toBeTruthy();
    expect(r.enDisplay, 'EN twin hidden on the Arabic page').toBe('none');
    expect(r.enVisible).toBeFalsy();
  });
});
