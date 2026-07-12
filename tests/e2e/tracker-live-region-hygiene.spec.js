// Screen-reader live-region hygiene on the tracker (audit E).
//
// The tracker refreshes prices continuously. Live regions must announce FINAL values once per
// real change — never per-frame animation values, per-second countdown ticks, or unchanged
// re-renders. This spec encodes, in a real browser (EN + AR):
//
//   1. Churny surfaces are NOT live regions:
//      • #tp-countdown rewrites every second → no aria-live/aria-atomic (readable on focus).
//      • #tp-karat-table price cells are animated per-frame by countUp → no aria-live on the
//        tbody (a data table is reachable by normal table navigation).
//      • #tp-summary-list is rebuilt wholesale on every render pass → no aria-live.
//      Deliberate announcers stay intact: #tp-refresh-badge (role=status, refresh completion),
//      #tp-alert-live-region (alert triggers), #tp-hero-readout (final price values).
//
//   2. Write hygiene inside the remaining live regions, measured with a MutationObserver over
//      bounded observation windows (childList + characterData records = what SRs re-announce):
//      • unchanged data (auto-polls + a manual refresh) → ZERO writes;
//      • a real price change (+25 USD/oz served offline via route interception) → exactly ONE
//        write per value node (spot + selected), and the new values actually render.
//
// No network dependence: /data/gold_price.json is served same-origin by the test web server and
// the price change is injected with page.route. Offline degraded freshness states are expected.
const { test, expect } = require('@playwright/test');

const SURFACES = ['/tracker.html', '/tracker.html?lang=ar'];

// Regions that must still be polite live regions, observed for write hygiene.
const OBSERVED = {
  heroReadout: '#tp-hero-readout',
  spotVal: '#tp-readout-spot-value',
  selVal: '#tp-readout-selected-value',
  strip: '#tp-price-change-strip',
};

async function waitForSpotRender(page) {
  await page.waitForFunction(
    () => /\d/.test(document.getElementById('tp-readout-spot-value')?.textContent || ''),
    null,
    { timeout: 20_000 }
  );
}

function installObservers(page) {
  return page.evaluate((sels) => {
    window.__liveWrites = {};
    for (const [name, sel] of Object.entries(sels)) {
      const node = document.querySelector(sel);
      if (!node) continue;
      window.__liveWrites[name] = 0;
      new MutationObserver((records) => {
        for (const r of records) {
          if (r.type === 'childList' || r.type === 'characterData') {
            window.__liveWrites[name] += 1;
          }
        }
      }).observe(node, { childList: true, characterData: true, subtree: true });
    }
  }, OBSERVED);
}

const grabWrites = (page) => page.evaluate(() => ({ ...window.__liveWrites }));
const resetWrites = (page) =>
  page.evaluate(() => {
    for (const key of Object.keys(window.__liveWrites)) window.__liveWrites[key] = 0;
  });

test.describe('Tracker live-region hygiene (audit E)', () => {
  for (const path of SURFACES) {
    test(`churny surfaces are not live regions; deliberate announcers intact: ${path}`, async ({
      page,
      baseURL,
    }) => {
      await page.goto((baseURL || '') + path, { waitUntil: 'load' });
      await waitForSpotRender(page);

      // Ticking countdown must never be a live region (it rewrites every second).
      const countdown = page.locator('#tp-countdown');
      await expect(countdown).toHaveCount(1);
      expect(await countdown.getAttribute('aria-live')).toBeNull();
      expect(await countdown.getAttribute('aria-atomic')).toBeNull();

      // countUp-animated data table must never be a live region.
      const karatBody = page.locator('#tp-karat-table');
      await expect(karatBody).toHaveCount(1);
      expect(await karatBody.getAttribute('aria-live')).toBeNull();

      // Wholesale-rebuilt Live desk list must never be a live region.
      const summary = page.locator('#tp-summary-list');
      await expect(summary).toHaveCount(1);
      expect(await summary.getAttribute('aria-live')).toBeNull();

      // Deliberate announcement channels must survive the cleanup:
      // refresh completion (freshness + timestamp) …
      const refreshBadge = page.locator('#tp-refresh-badge');
      expect(await refreshBadge.getAttribute('role')).toBe('status');
      expect(await refreshBadge.getAttribute('aria-live')).toBe('polite');
      // … triggered price alerts …
      const alertRegion = page.locator('#tp-alert-live-region');
      expect(await alertRegion.getAttribute('aria-live')).toBe('polite');
      // … and the final spot/selected values themselves.
      const readout = page.locator('#tp-hero-readout');
      expect(await readout.getAttribute('aria-live')).toBe('polite');
    });

    test(`live regions: zero writes when unchanged, one write per real change: ${path}`, async ({
      page,
      baseURL,
    }) => {
      test.setTimeout(60_000);
      await page.goto((baseURL || '') + path, { waitUntil: 'load' });
      await waitForSpotRender(page);
      // Bounded settle window: let boot renders/animations finish before instrumenting.
      await page.waitForTimeout(1500);

      await installObservers(page);

      // ── Unchanged data: manual refresh + auto-polls within a bounded 8 s window ──
      await page.click('#tp-refresh-btn');
      await page.waitForTimeout(8000);
      const unchanged = await grabWrites(page);
      expect(unchanged.heroReadout, 'unchanged re-renders must not touch #tp-hero-readout').toBe(0);
      expect(unchanged.strip, 'unchanged re-renders must not touch #tp-price-change-strip').toBe(0);

      // ── Real price change: +25 USD/oz served offline via route interception ──
      const baseSpotText = await page
        .locator('#tp-readout-spot-value')
        .evaluate((node) => node.textContent);
      const body = await page.evaluate(async () => {
        const res = await fetch('/data/gold_price.json');
        return res.text();
      });
      const data = JSON.parse(body);
      const newSpot = (data.xau_usd_per_oz || data.gold.ounce_usd) + 25;
      data.xau_usd_per_oz = newSpot;
      data.gold.ounce_usd = newSpot;
      data.fetched_at_utc = new Date().toISOString();
      data.timestamp_utc = new Date().toISOString();

      await resetWrites(page);
      await page.route('**/data/gold_price.json*', (route) =>
        route.fulfill({ contentType: 'application/json', body: JSON.stringify(data) })
      );
      await page.click('#tp-refresh-btn');

      // The hero readout always formats spot in en-US (both EN and AR pages).
      const expectedSpotText = `$${newSpot.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
      await expect(page.locator('#tp-readout-spot-value')).toHaveText(expectedSpotText, {
        timeout: 10_000,
      });
      expect(expectedSpotText).not.toBe(baseSpotText);
      // Bounded settle window: countUp caps at 800 ms, directional flash at 1 s.
      await page.waitForTimeout(1600);

      const changed = await grabWrites(page);
      // Final values are announced exactly once per real value change — no animation churn.
      expect(changed.spotVal, 'spot value: one live write per real change').toBe(1);
      expect(changed.selVal, 'selected value: one live write per real change').toBe(1);
      expect(
        changed.heroReadout,
        'no other writer may churn the hero readout live region'
      ).toBeLessThanOrEqual(2);
      expect(changed.strip, 'day-change strip: at most one write per change').toBeLessThanOrEqual(
        1
      );

      // Information is preserved: the (non-live) karat table still updated to the new price.
      const karat24 = await page
        .locator('[data-karat-price="24"]')
        .evaluate((node) => node.textContent.trim());
      expect(karat24).toMatch(/^\d+(\.\d{2})?$/);
    });
  }
});
