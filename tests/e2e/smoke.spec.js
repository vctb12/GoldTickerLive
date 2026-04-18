const { test, expect } = require('@playwright/test');

test.describe('Smoke: core pages', () => {
  test('Home page loads and has title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Gold Prices|Gold/);
    const nav = await page.$('nav');
    expect(nav).not.toBeNull();
  });

  test('Tracker page loads and shows chart container', async ({ page }) => {
    await page.goto('/tracker.html');
    await expect(page).toHaveURL(/tracker.html/);
    const chart = await page.$('[data-gold-chart], #chart, .gold-chart');
    expect(chart).not.toBeNull();
  });

  test('Shops page loads and lists shops', async ({ page }) => {
    await page.goto('/shops.html');
    await expect(page).toHaveURL(/shops.html/);
    const list = await page.$('main, .shops-list, #shops');
    expect(list).not.toBeNull();
  });
});
