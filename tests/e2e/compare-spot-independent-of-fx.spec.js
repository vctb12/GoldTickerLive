// Compare: spot + AED-peg UAE prices render independently of the FX fetch.
//
// Regression guard for L2-COMPARE-02. The compare tool fetches the gold spot
// snapshot and the FX rate table on separate lanes. The USD spot badge and the
// AED-peg UAE row need only the spot snapshot (the peg is fixed, not an FX rate),
// yet the page used to render nothing until BOTH lanes settled via a single
// `Promise.allSettled([spot, fx])`. When open.er-api.com hangs, `api.fetchFX()`
// burns its full budget — three 8s timeouts plus 1s+2s backoff ≈ 27s — so the
// spot price and UAE prices stayed blank for ~27s even though the gold data had
// landed in well under a second.
//
// This spec holds the FX endpoint open (each in-page attempt aborts at its 8s
// timeout, so the whole fetchFX call takes ~27s) and asserts the spot badge and
// the UAE row price appear within a 10s window — comfortably after the sub-second
// spot resolve but long before FX could settle. Against the pre-fix code this
// fails (spot waited on FX); against the decoupled render it passes.
const { test, expect } = require('@playwright/test');

const MONEY_RE = /\d[\d,]*\.\d{2}/; // formatPrice / fmtUsd always emit en-US digits

// Service workers could satisfy requests outside page.route interception; block
// them so the route below fully controls the FX lane.
test.use({ serviceWorkers: 'block' });

/**
 * Simulate a hanging FX endpoint. The handler never continues/fulfills, so each
 * in-page fetch attempt pends until fetchWithTimeout's AbortController fires at
 * 8s; across the 3 retry attempts fetchFX takes ~27s. The 40s backstop timer only
 * exists so the route resolves cleanly at teardown.
 */
async function hangFx(page) {
  await page.route('**/open.er-api.com/**', async (route) => {
    await new Promise((r) => setTimeout(r, 40000));
    try {
      await route.abort();
    } catch {
      /* context already closed at teardown */
    }
  });
}

test.describe('Compare renders spot + UAE prices without waiting for FX', () => {
  test('spot badge and AED-peg UAE row appear while FX is hung', async ({ page, baseURL }) => {
    await hangFx(page);
    await page.goto((baseURL || '') + '/compare.html', { waitUntil: 'domcontentloaded' });

    // Spot badge shows the USD/oz value within a bounded window — no FX needed.
    await expect(page.locator('#compare-spot-price')).toContainText(/\$\d/, { timeout: 10000 });

    // The pinned UAE reference row (fixed AED peg → FX-independent) shows real
    // price-formatted numbers, not the '—' / "Unavailable" placeholder.
    const uaeRow = page.locator('.compare-table tbody tr.compare-row--ref').first();
    await expect(uaeRow).toBeVisible({ timeout: 10000 });
    await expect(uaeRow).toContainText(MONEY_RE);
    await expect(uaeRow).not.toContainText('Unavailable');
  });
});
