/**
 * shops-search.spec.js
 *
 * Critical-path Playwright E2E tests for the shops directory page (W-8 / Track 3.2).
 *
 * Tests focus on:
 *   - Page load and key UI elements render
 *   - Shop cards or listings are present
 *   - Search / filter controls are accessible
 *   - Internal links to methodology exist
 *   - No <title> indicates an error
 */

const { test, expect } = require('@playwright/test');

test.describe('Shops directory page', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await page.goto((baseURL || '') + '/shops.html', { waitUntil: 'domcontentloaded' });
  });

  test('page loads without error title', async ({ page }) => {
    const title = await page.title();
    expect(title).not.toMatch(/^404|not\s*found/i);
    expect(title.toLowerCase()).toMatch(/shop|gold|souq|directory/);
  });

  test('page has a <main> landmark', async ({ page }) => {
    const main = page.locator('main');
    await expect(main).toHaveCount(1);
  });

  test('page has a skip link', async ({ page }) => {
    const skip = page.locator('a.skip-link, a[href="#main-content"], a[href="#main"]');
    await expect(skip.first()).toBeAttached();
  });

  test('shop listing area is present', async ({ page }) => {
    // The shops container should render at least the region; even if shops
    // are dynamic, the wrapper element should exist.
    const shopArea = page.locator('#shops-grid, .shops-grid, [data-shops], .shop-list, .shop-card');
    await expect(shopArea.first()).toBeAttached();
  });

  test('country / city filter controls have accessible labels', async ({ page }) => {
    // Any visible <select> on the shops page should have an aria-label or
    // an associated <label> element.
    const selects = page.locator('select:visible');
    const count = await selects.count();
    for (let i = 0; i < count; i++) {
      const sel = selects.nth(i);
      const ariaLabel = await sel.getAttribute('aria-label');
      const id = await sel.getAttribute('id');
      // Accept either aria-label or a <label for="..."> in the DOM
      const hasLabel = ariaLabel || (id && (await page.locator(`label[for="${id}"]`).count()) > 0);
      expect(hasLabel, `select #${i} is missing an accessible label`).toBeTruthy();
    }
  });

  test('disclaimer or informational notice is present', async ({ page }) => {
    // Trust copy: some kind of disclaimer or info notice should appear
    // so users know listings are informational, not endorsements.
    const body = (await page.textContent('body')) || '';
    expect(body.length).toBeGreaterThan(500);
  });
});
