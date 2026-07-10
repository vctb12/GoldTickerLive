// Learn-hub reading-progress e2e — the browser-DOM confirmation that unit tests can't give:
// (1) the hub hydrates without the historical `InvalidStateError: Transition was aborted…` console
//     error, and (2) the "Read N of M featured guides" counter actually increments on a guide-card
//     click and persists across a full reload (the two bugs flagged for this run).
//
// Served the same way as the rest of the e2e suite: `python3 -m http.server 8080` at repo root, so
// `./src/pages/learn.js` (native ESM) hydrates directly with no build step.
const { test, expect } = require('@playwright/test');

/** Pull the integer "read" count out of the progress line, whatever the surrounding copy. */
function readCountFrom(text) {
  const m = (text || '').match(/(\d+)\s*(?:of|\/|من)\s*(\d+)/i);
  return m ? { read: Number(m[1]), total: Number(m[2]) } : null;
}

test.describe('Learn hub: reading progress + console stability', () => {
  test('counter increments on card click, persists across reload, no InvalidStateError', async ({
    page,
    baseURL,
  }) => {
    const badErrors = [];
    page.on('console', (msg) => {
      if (msg.type() !== 'error') return;
      const txt = msg.text();
      if (/InvalidStateError|Transition was aborted/i.test(txt)) badErrors.push(txt);
    });
    page.on('pageerror', (err) => {
      const txt = String(err);
      if (/InvalidStateError|Transition was aborted/i.test(txt)) badErrors.push(txt);
    });

    // Fresh localStorage so we start from a known "read 0" state.
    await page.goto((baseURL || '') + '/learn.html', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Wait for hydration: the live progress line is rendered by mountLearnHubCatalog().
    const progress = page.locator('.learn-hub-progress');
    await expect(progress).toBeVisible({ timeout: 10_000 });

    const initial = readCountFrom(await progress.textContent());
    expect(initial, 'progress line should expose an "N of M" count').not.toBeNull();
    expect(initial.read).toBe(0);
    expect(initial.total).toBeGreaterThan(0);

    // Click the first hydrated guide card (delegated handler → markGuideRead + refreshReadState).
    const firstCard = page.locator('.learn-guide-card[data-guide-href]').first();
    await expect(firstCard).toBeVisible();
    await firstCard.click();

    // Counter must advance to at least 1 live (no reload).
    await expect
      .poll(async () => readCountFrom(await progress.textContent())?.read ?? -1, {
        timeout: 5_000,
      })
      .toBeGreaterThanOrEqual(1);

    // Persistence: a full reload must recompute from localStorage and keep the incremented count.
    await page.reload({ waitUntil: 'domcontentloaded' });
    const progressAfter = page.locator('.learn-hub-progress');
    await expect(progressAfter).toBeVisible({ timeout: 10_000 });
    await expect
      .poll(async () => readCountFrom(await progressAfter.textContent())?.read ?? -1, {
        timeout: 5_000,
      })
      .toBeGreaterThanOrEqual(1);

    // The historical console error must not appear at any point.
    expect(badErrors, `unexpected view-transition errors: ${badErrors.join(' | ')}`).toEqual([]);
  });
});
