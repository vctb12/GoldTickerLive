const { test, expect } = require('@playwright/test');

test.describe('Smoke: critical pages', () => {
  const pages = ['/', '/index.html', '/shops.html', '/tracker.html', '/countries/index.html'];

  for (const p of pages) {
    test(`loads ${p}`, async ({ page, baseURL }) => {
      const url = (baseURL || '') + p;
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      // Ensure no 404-like title or visible 404 text
      const body = await page.content();
      expect(body.toLowerCase()).not.toContain('404');
      expect(await page.title()).not.toMatch(/404|not found/i);
    });
  }
});
