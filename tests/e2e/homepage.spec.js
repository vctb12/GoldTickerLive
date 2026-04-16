// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Homepage smoke tests', () => {
  test('has a title containing Gold', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Gold/i);
  });

  test('displays a price element', async ({ page }) => {
    await page.goto('/');
    const priceElement = page.locator(
      '[data-testid="gold-price"], .price, #gold-price, .gold-price, .spot-price'
    );
    await expect(priceElement.first()).toBeVisible({ timeout: 10000 });
  });
});
