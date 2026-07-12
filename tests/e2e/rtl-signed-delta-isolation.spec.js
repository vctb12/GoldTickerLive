// @ts-check
// Audit E — RTL bidi reordering of signed deltas.
//
// In Arabic (RTL) context a signed delta like "+$36.30" visually reorders to
// "$36.30+" because the leading sign is bidi-neutral and gets displaced by the
// Unicode bidi algorithm. The fix wraps every DOM-rendered signed delta in
// LRI (U+2066) … PDI (U+2069) via bidiIsolate() — unconditionally, in EN too
// (invisible and harmless in LTR).
//
// This spec is network-independent: the spot price comes from the committed
// local /data/gold_price.json snapshot, and the day-open reference is seeded
// into localStorage (1% below spot, so the day change is always a non-flat,
// signed delta) before the page loads.
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const LRI = '\u2066';
const PDI = '\u2069';
const ISOLATED_DELTA = new RegExp(`${LRI}[^${PDI}]*\\d[^${PDI}]*${PDI}`);

function readLocalSpot() {
  const raw = fs.readFileSync(
    path.resolve(__dirname, '..', '..', 'data', 'gold_price.json'),
    'utf-8'
  );
  const spot = JSON.parse(raw).xau_usd_per_oz;
  if (!Number.isFinite(spot) || spot <= 0) {
    throw new Error('data/gold_price.json has no usable xau_usd_per_oz');
  }
  return spot;
}

async function seedDayOpen(page) {
  const dayOpen = Math.round(readLocalSpot() * 0.99 * 100) / 100;
  await page.addInitScript((price) => {
    const dubaiDate = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dubai' });
    window.localStorage.setItem('gold_day_open', JSON.stringify({ price, dubaiDate }));
  }, dayOpen);
}

test.describe('Signed deltas are bidi-isolated (audit E)', () => {
  test('tracker ?lang=ar renders the day-change delta wrapped in LRI…PDI', async ({
    page,
    baseURL,
  }) => {
    await seedDayOpen(page);
    await page.goto((baseURL || '') + '/tracker.html?lang=ar', { waitUntil: 'load' });

    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

    const strip = page.locator('#tp-price-change-strip');
    await strip.waitFor({ state: 'attached', timeout: 20000 });
    // Auto-retrying: waits until the strip has rendered its signed delta.
    await expect(strip).toHaveText(ISOLATED_DELTA, { timeout: 20000 });

    const text = await strip.textContent();
    expect(text).toContain(LRI);
    expect(text).toContain(PDI);
    // The signed amount itself must sit inside the isolate, not outside it.
    expect(text).toMatch(new RegExp(`${LRI}[+−]\\$?\\d`));
  });

  test('tracker ?lang=en still renders the delta (isolation chars allowed in EN)', async ({
    page,
    baseURL,
  }) => {
    await seedDayOpen(page);
    await page.goto((baseURL || '') + '/tracker.html?lang=en', { waitUntil: 'load' });

    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');

    const strip = page.locator('#tp-price-change-strip');
    await strip.waitFor({ state: 'attached', timeout: 20000 });
    await expect(strip).toHaveText(ISOLATED_DELTA, { timeout: 20000 });

    const text = await strip.textContent();
    // EN keeps the isolate wrapper too — simpler, and invisible in LTR.
    expect(text).toContain(LRI);
    expect(text).toContain(PDI);
    // Human-visible content is intact around the control characters.
    expect(text.replace(new RegExp(`[${LRI}${PDI}]`, 'g'), '')).toMatch(/[+−]\$\d/);
  });
});
