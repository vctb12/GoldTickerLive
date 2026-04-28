// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Language toggle — EN ↔ AR', () => {
  test('homepage lang toggle switches to Arabic and persists', async ({ page }) => {
    await page.goto('/');
    // Wait for nav to load (injected client-side)
    await page.waitForSelector('.nav-lang-btn', { timeout: 10000 });

    // Page should start in EN
    const htmlEl = page.locator('html');
    await expect(htmlEl).toHaveAttribute('lang', 'en');

    // Click the language toggle
    const langBtn = page.locator('#nav-lang-toggle').first();
    await langBtn.click();

    // Page should switch to Arabic
    await expect(htmlEl).toHaveAttribute('lang', 'ar');
    await expect(htmlEl).toHaveAttribute('dir', 'rtl');

    // Reload and verify persistence
    await page.reload();
    await page.waitForSelector('.nav-lang-btn', { timeout: 10000 });
    await expect(htmlEl).toHaveAttribute('lang', 'ar');
  });

  test('can switch back from Arabic to English', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.nav-lang-btn', { timeout: 10000 });

    // Switch to Arabic
    const langBtn = page.locator('#nav-lang-toggle').first();
    await langBtn.click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');

    // Switch back to English
    await langBtn.click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  });

  test('hero heading is visible in both languages', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#hero-headline', { timeout: 10000 });

    // EN hero heading
    const headline = page.locator('#hero-headline');
    await expect(headline).toBeVisible();

    // Switch to AR
    const langBtn = page.locator('#nav-lang-toggle').first();
    await langBtn.click();

    // Hero heading still visible in AR
    await expect(headline).toBeVisible();
  });

  test('mobile drawer lang toggle also works', async ({ page }) => {
    // Simulate mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForSelector('.nav-hamburger', { timeout: 10000 });

    // Open mobile drawer
    await page.locator('.nav-hamburger').click();
    await page.waitForSelector('#nav-drawer:not([aria-hidden="true"])', { timeout: 5000 });

    // Click mobile lang toggle
    const mobileLangBtn = page.locator('#nav-lang-toggle-mobile');
    await mobileLangBtn.click();

    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  });
});
