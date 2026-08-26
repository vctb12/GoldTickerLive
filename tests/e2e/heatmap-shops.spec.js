// Heatmap + Shops "no empty render" surface guards (the last two major interactive surfaces).
//
// Both hydrate a fair amount of client data (a world map with per-country values; a shops directory).
// A boot/data regression could leave either blank. This locks their substance:
//   • Heatmap — renders a map with many country shapes, a legend, price-formatted values, and no
//     console errors.
//   • Shops — renders a populated directory (cards) with filter controls.
// 2026-07-10 sweep: heatmap 156 country paths / legend / 63 prices / 0 console errors; shops 87 cards.
const { test, expect } = require('@playwright/test');

function sameOrigin(url, baseURL) {
  try {
    return new URL(url).host === new URL(baseURL).host;
  } catch {
    return false;
  }
}

test.describe('Heatmap renders a populated map', () => {
  test('map shapes + legend + prices, no console errors', async ({ page, baseURL }) => {
    const runtimeErrors = [];
    const sameOriginFailures = [];
    page.on('pageerror', (error) => runtimeErrors.push(String(error)));
    page.on('response', (response) => {
      if (response.status() >= 400 && sameOrigin(response.url(), baseURL)) {
        sameOriginFailures.push(`HTTP ${response.status()} ${response.url()}`);
      }
    });
    page.on('requestfailed', (request) => {
      const failure = request.failure()?.errorText || 'failed';
      if (sameOrigin(request.url(), baseURL) && !/ERR_ABORTED/.test(failure)) {
        sameOriginFailures.push(`${failure} ${request.url()}`);
      }
    });

    await page.goto((baseURL || '') + '/heatmap.html', { waitUntil: 'load' });
    await page.waitForTimeout(2500); // world-map data + render

    const h = await page.evaluate(() => ({
      shapes: document.querySelectorAll('svg path, .country, [class*="country"], [class*="region"]')
        .length,
      hasLegend: Boolean(document.querySelector('[class*="legend"], [id*="legend"]')),
      priceNums: ((document.body.textContent || '').match(/\d[\d,]*\.\d{2}/g) || []).length,
      hasMap: Boolean(
        document.querySelector('svg, .leaflet-container, [class*="map"], [id*="heatmap"]')
      ),
    }));

    expect(h.hasMap, 'heatmap must render a map element').toBe(true);
    expect(h.shapes, 'heatmap must render many country shapes').toBeGreaterThan(20);
    expect(h.hasLegend, 'heatmap must render a legend').toBe(true);
    expect(h.priceNums, 'heatmap must show price-formatted values').toBeGreaterThan(3);
    // First-party runtime must be clean; cross-origin enhancements have verified fallbacks.
    expect(runtimeErrors, `heatmap runtime errors: ${runtimeErrors.join(' | ')}`).toEqual([]);
    expect(
      sameOriginFailures,
      `heatmap first-party failures: ${sameOriginFailures.join(' | ')}`
    ).toEqual([]);
  });
});

test.describe('Shops directory renders a populated list', () => {
  test('shop cards + filter controls render', async ({ page, baseURL }) => {
    await page.goto((baseURL || '') + '/shops.html', { waitUntil: 'load' });
    await page.waitForTimeout(2000);

    const s = await page.evaluate(() => ({
      cards: document.querySelectorAll('.shop-card, [data-shop-id], [class*="shop-card"], article')
        .length,
      filters: document.querySelectorAll(
        'select, button[class*="filter"], [class*="filter"] button, input[type="search"]'
      ).length,
      bodyLen: (document.body.textContent || '').trim().length,
    }));

    expect(s.cards, 'shops must render directory cards').toBeGreaterThan(10);
    expect(s.filters, 'shops must render filter controls').toBeGreaterThan(0);
    expect(s.bodyLen, 'shops must have substantive content').toBeGreaterThan(2000);
  });
});
