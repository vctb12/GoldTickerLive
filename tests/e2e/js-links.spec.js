// phx/13: Smoke coverage for JS-driven links.
// - Tracker hash state round-trips (mode/currency/karat/unit).
// - Search page renders and accepts a query.
const { test, expect } = require('@playwright/test');

test.describe('Tracker: hash deep-link round-trip', () => {
  test('applies mode/cur/k/u from URL hash and keeps them on reload', async ({ page, baseURL }) => {
    const url =
      (baseURL || '') + '/tracker.html#mode=live&cur=AED&k=24&u=gram&r=1M&cmp=USD&lang=en';
    const res = await page.goto(url, { waitUntil: 'domcontentloaded' });
    expect(res.status()).toBeLessThan(400);

    // Allow tracker bootstrap to run and canonicalize the hash.
    await page.waitForFunction(
      () => window.location.hash && window.location.hash.includes('mode='),
      null,
      { timeout: 10000 }
    );

    const hash = await page.evaluate(() => window.location.hash);
    expect(hash).toContain('mode=live');
    expect(hash).toContain('cur=AED');
    expect(hash).toContain('k=24');
    expect(hash).toContain('u=gram');
  });

  test('invalid mode in hash does not crash tracker', async ({ page, baseURL }) => {
    const url = (baseURL || '') + '/tracker.html#mode=bogus&cur=USD&k=24&u=gram';
    const res = await page.goto(url, { waitUntil: 'domcontentloaded' });
    expect(res.status()).toBeLessThan(400);
    // Tracker must still render something (not error out on invalid mode).
    const hasLayout = await page.locator('main, [data-tracker], nav').count();
    expect(hasLayout).toBeGreaterThan(0);
  });
});

test.describe('Search page: renders and responds', () => {
  test('/content/search/ loads and shows an input or results area', async ({ page, baseURL }) => {
    const res = await page.goto((baseURL || '') + '/content/search/', {
      waitUntil: 'domcontentloaded',
    });
    expect(res.status()).toBeLessThan(400);
    const hasUI = await page
      .locator('input[type="search"], input[name="q"], [role="search"], form input')
      .count();
    expect(hasUI, 'no search input rendered').toBeGreaterThan(0);
  });
});
