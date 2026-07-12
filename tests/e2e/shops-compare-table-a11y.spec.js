const { test, expect } = require('@playwright/test');

// Regression guard for the shops compare-modal table semantics (audit B).
//
// The modal table rendered its row labels as `<td class="shops-compare-row-label">`,
// its column headers as bare `<th>` without `scope="col"`, its corner cell as an
// empty `<th>`, and carried no accessible name — so screen readers navigating a
// shop column never heard which attribute (Location / Market / …) a cell
// belonged to. Fix: row labels are `<th scope="row">`, column headers carry
// `scope="col"`, the corner is a plain `<td>`, and the table is named via
// `aria-labelledby="shops-compare-modal-title"` (the dialog's visible,
// localized title — no new strings).
//
// This spec drives the real UI (select shops on the grid, open the compare
// modal from the sticky bar) in EN and AR and locks all four fixes. Shops
// render from bundled local data, so no network is required. Sticky overlays
// (header spot bar, mobile bottom nav) intercept pointer clicks at 390px, so
// shop selection dispatches DOM clicks on the real buttons — the page's own
// listeners still run.

const MOBILE = { width: 390, height: 844 };

async function openCompareModal(page, lang) {
  await page.goto(`/shops.html${lang === 'ar' ? '?lang=ar' : ''}`);
  if (lang === 'ar') {
    await page.waitForFunction(() => document.documentElement.dir === 'rtl', undefined, {
      timeout: 10000,
    });
  }
  await page.waitForSelector('[data-compare-shop-id]', { state: 'attached', timeout: 10000 });
  await page.$$eval('[data-compare-shop-id]', (btns) => btns.slice(0, 3).forEach((b) => b.click()));
  await page.waitForSelector('.shops-compare-bar-go:not([disabled])', {
    state: 'attached',
    timeout: 10000,
  });
  await page.$eval('.shops-compare-bar-go', (b) => b.click());
  await page.waitForSelector('.shops-compare-table', { state: 'attached', timeout: 10000 });
}

test.describe('Shops compare modal table semantics', () => {
  test.use({ viewport: MOBILE });

  for (const lang of ['en', 'ar']) {
    test(`[${lang}] row headers, column scopes, corner cell, table name`, async ({ page }) => {
      await openCompareModal(page, lang);

      const r = await page.evaluate(() => {
        const table = document.querySelector('.shops-compare-table');
        const bodyRows = [...table.querySelectorAll('tbody tr')];
        const headCells = [...table.querySelectorAll('thead tr > *')];
        const corner = headCells[0];
        const colHeads = headCells.slice(1);
        const labelId = table.getAttribute('aria-labelledby');
        const labelEl = labelId && document.getElementById(labelId);
        return {
          bodyRowCount: bodyRows.length,
          badRowLabels: bodyRows.filter((tr) => {
            const first = tr.firstElementChild;
            return !(first.tagName === 'TH' && first.getAttribute('scope') === 'row');
          }).length,
          colHeadCount: colHeads.length,
          badColHeads: colHeads.filter(
            (c) => !(c.tagName === 'TH' && c.getAttribute('scope') === 'col')
          ).length,
          cornerTag: corner.tagName,
          labelId,
          labelText: labelEl ? labelEl.textContent.trim() : '',
          labelIsModalTitle: labelId === 'shops-compare-modal-title' && !!labelEl,
        };
      });

      expect(r.bodyRowCount, 'compare table renders attribute rows').toBeGreaterThan(0);
      expect(r.badRowLabels, 'every tbody row starts with th[scope=row]').toBe(0);
      expect(r.colHeadCount, 'one column header per compared shop').toBe(3);
      expect(r.badColHeads, 'every shop column header is th[scope=col]').toBe(0);
      expect(r.cornerTag, 'corner cell must not be a header').toBe('TD');
      expect(r.labelIsModalTitle, 'table named by the visible modal title').toBeTruthy();
      expect(r.labelText.length, 'accessible name resolves to non-empty text').toBeGreaterThan(0);
    });
  }
});
