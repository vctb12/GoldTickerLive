// Calculator numeric-accuracy guard — the most trust-critical check.
//
// Drives the value calculator with known inputs and asserts the displayed AED matches the derived
// pricing formula built from the SAME spot the page uses (fetched from /data/gold_price.json):
//
//     aed = (xau_usd_per_oz / TROY_OZ_GRAMS) * purity * AED_PEG * grams
//
// with the immutable constants TROY_OZ_GRAMS = 31.1035 and AED_PEG = 3.6725. Verified for 24K
// (purity 1.0) and 22K (purity 22/24). A regression in the karat math, the peg, or the troy
// conversion would fail here. (2026-07-10: 10 g / 24K / AED → 4,867.82 د.إ, exact.)
const { test, expect } = require('@playwright/test');

const TROY_OZ_GRAMS = 31.1035;
const AED_PEG = 3.6725;

function parseAmount(text) {
  // "4,867.82 د.إ" / "1,325.48 $" → 4867.82 / 1325.48
  const m = (text || '').replace(/,/g, '').match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : NaN;
}

async function spotUsdPerOz(page, baseURL) {
  return page.evaluate(async (base) => {
    const res = await fetch(`${base}/data/gold_price.json?t=${Date.now()}`);
    const d = await res.json();
    return d.xau_usd_per_oz;
  }, baseURL || '');
}

async function computeAed(page, baseURL, { grams, purity }) {
  const xau = await spotUsdPerOz(page, baseURL);
  return (xau / TROY_OZ_GRAMS) * purity * AED_PEG * grams;
}

test.describe('Calculator numeric accuracy (AED = spot/31.1035 * purity * 3.6725 * grams)', () => {
  for (const { karat, purity } of [
    { karat: '24', purity: 1.0 },
    { karat: '22', purity: 22 / 24 },
  ]) {
    test(`10 g ${karat}K in AED matches the derived formula`, async ({ page, baseURL }) => {
      await page.goto((baseURL || '') + '/calculator.html', { waitUntil: 'load' });
      await page.waitForTimeout(1200);

      await page.selectOption('#val-unit', 'gram').catch(() => {});
      await page.selectOption('#val-karat', karat);
      await page.selectOption('#val-currency', 'AED');
      await page.fill('#val-weight', '10');
      await page.waitForTimeout(1000);

      const shown = parseAmount(await page.locator('#val-result-value').textContent());
      const expected = await computeAed(page, baseURL, { grams: 10, purity });

      expect(Number.isFinite(shown), `no numeric result for ${karat}K`).toBe(true);
      // Allow a couple cents for 2-decimal display rounding across the computation.
      expect(
        Math.abs(shown - expected),
        `${karat}K: shown ${shown} vs formula ${expected}`
      ).toBeLessThan(0.05);
    });
  }

  test('22K value is exactly 22/24 of the 24K value (purity scaling)', async ({
    page,
    baseURL,
  }) => {
    await page.goto((baseURL || '') + '/calculator.html', { waitUntil: 'load' });
    await page.waitForTimeout(1200);
    await page.selectOption('#val-unit', 'gram').catch(() => {});
    await page.selectOption('#val-currency', 'AED');
    await page.fill('#val-weight', '10');

    await page.selectOption('#val-karat', '24');
    await page.waitForTimeout(800);
    const v24 = parseAmount(await page.locator('#val-result-value').textContent());

    await page.selectOption('#val-karat', '22');
    await page.waitForTimeout(800);
    const v22 = parseAmount(await page.locator('#val-result-value').textContent());

    expect(
      Math.abs(v22 - v24 * (22 / 24)),
      `22K ${v22} vs 24K*22/24 ${v24 * (22 / 24)}`
    ).toBeLessThan(0.05);
  });
});
