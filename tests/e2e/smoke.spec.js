// Critical-page smoke suite. Gated on CI; must remain fast and stable.
const { test, expect } = require('@playwright/test');

const criticalPages = [
  { path: '/', name: 'home (root)' },
  { path: '/index.html', name: 'home (explicit)' },
  { path: '/shops.html', name: 'shops' },
  { path: '/tracker.html', name: 'tracker' },
  { path: '/calculator.html', name: 'calculator' },
  { path: '/countries/index.html', name: 'countries index' },
  { path: '/countries/uae/gold-price/index.html', name: 'country page (UAE)' },
];

test.describe('Smoke: critical pages load', () => {
  for (const { path, name } of criticalPages) {
    test(`${name} at ${path}`, async ({ page, baseURL }) => {
      const url = (baseURL || '') + path;
      const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
      expect(response, `no response for ${path}`).not.toBeNull();
      expect(response.status(), `bad status for ${path}`).toBeLessThan(400);
      // Title should not indicate an error page
      expect(await page.title()).not.toMatch(/^404|not\s*found/i);
      // Must have a <main> or <nav> element — rules out fully broken renders
      const hasLayout = await page.locator('main, nav, header').count();
      expect(hasLayout, `no layout element on ${path}`).toBeGreaterThan(0);
    });
  }
});

test.describe('Smoke: 404 page', () => {
  test('404.html renders the not-found page', async ({ page, baseURL }) => {
    const url = (baseURL || '') + '/404.html';
    const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
    expect(response, 'no response for 404.html').not.toBeNull();
    // 404.html is served directly here; server returns 200. Content must indicate "not found".
    const bodyText = (await page.textContent('body')) || '';
    expect(bodyText.toLowerCase()).toMatch(/not found|404|page.*(missing|doesn't exist)/);
  });
});
