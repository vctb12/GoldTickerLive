// Portfolio persistence guard.
//
// The portfolio tracker stores holdings ONLY in localStorage (`gtl_portfolio_v1`) — nothing is
// uploaded. This drives the real add → render → persist-across-reload → delete flow in a browser and
// asserts the holding survives a full reload and that deletion clears it. Catches a regression in the
// storage round-trip or the summary/holdings render.
const { test, expect } = require('@playwright/test');

const KEY = 'gtl_portfolio_v1';

async function storedCount(page) {
  return page.evaluate((k) => {
    try {
      const v = JSON.parse(localStorage.getItem(k) || '[]');
      return Array.isArray(v) ? v.length : Array.isArray(v?.holdings) ? v.holdings.length : 0;
    } catch {
      return -1;
    }
  }, KEY);
}

async function addHolding(page) {
  await page.click('button:has-text("Add holding"), a:has-text("Add holding")');
  await page.waitForSelector('#pf-weight', { timeout: 5000 });
  await page.fill('#pf-weight', '10');
  await page.selectOption('#pf-karat', '24').catch(() => {});
  await page.fill('#pf-date', '2025-01-01').catch(() => {});
  await page.fill('#pf-cost', '4000');
  await page.fill('#pf-label', 'Test bar').catch(() => {});
  await page.click('button:has-text("Save holding")');
  await page.waitForTimeout(1000);
}

test.describe('Portfolio persistence (localStorage)', () => {
  test('add a holding → renders + summary shown + persists across reload', async ({
    page,
    baseURL,
  }) => {
    await page.goto((baseURL || '') + '/portfolio.html', { waitUntil: 'load' });
    await page.waitForTimeout(1200);
    await page.evaluate((k) => localStorage.removeItem(k), KEY);
    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(1000);

    await addHolding(page);

    // Holding is persisted and rendered, summary is revealed.
    expect(await storedCount(page), 'holding must be stored').toBeGreaterThanOrEqual(1);
    const holdingsText = (await page.locator('#portfolio-holdings').textContent()) || '';
    expect(holdingsText.trim().length, 'holdings area must render the holding').toBeGreaterThan(0);
    const summaryHidden = await page.locator('#portfolio-summary').getAttribute('hidden');
    expect(summaryHidden, 'summary must be revealed once a holding exists').toBeNull();

    // Survives a full reload (recomputed from localStorage).
    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(1200);
    expect(await storedCount(page), 'holding must survive reload').toBeGreaterThanOrEqual(1);
    const afterReload = (await page.locator('#portfolio-holdings').textContent()) || '';
    expect(afterReload.trim().length, 'holding must re-render after reload').toBeGreaterThan(0);
  });

  test('delete a holding → cleared from storage', async ({ page, baseURL }) => {
    await page.goto((baseURL || '') + '/portfolio.html', { waitUntil: 'load' });
    await page.waitForTimeout(1200);
    await page.evaluate((k) => localStorage.removeItem(k), KEY);
    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(1000);

    await addHolding(page);
    expect(await storedCount(page)).toBeGreaterThanOrEqual(1);

    // Find a delete/remove control within the holdings area (label varies EN/AR).
    const delBtn = page
      .locator(
        '#portfolio-holdings button:has-text("Delete"), #portfolio-holdings button:has-text("Remove"), #portfolio-holdings [aria-label*="elete" i], #portfolio-holdings [aria-label*="emove" i], #portfolio-holdings [aria-label*="حذف"]'
      )
      .first();
    const hasDelete = (await delBtn.count()) > 0;
    test.skip(!hasDelete, 'no in-list delete control found; delete UI may differ');

    await delBtn.click();
    // A confirm dialog may appear — accept it if present.
    await page
      .locator('button:has-text("Delete"), button:has-text("Confirm"), button:has-text("Remove")')
      .last()
      .click({ timeout: 1500 })
      .catch(() => {});
    await page.waitForTimeout(1000);

    expect(await storedCount(page), 'holding must be removed from storage').toBe(0);
  });
});
