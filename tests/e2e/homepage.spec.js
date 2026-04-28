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

test.describe('Homepage — structure and key landmarks', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
  });

  test('has a <main> landmark', async ({ page }) => {
    await expect(page.locator('main')).toHaveCount(1);
  });

  test('has a skip link', async ({ page }) => {
    const skip = page.locator('a.skip-link, a[href="#main-content"], a[href="#main"]');
    await expect(skip.first()).toBeAttached();
  });

  test('hero section contains a primary CTA to the tracker', async ({ page }) => {
    const cta = page.locator('a[href*="tracker"]').first();
    await expect(cta).toBeAttached();
  });

  test('karat strip is present', async ({ page }) => {
    const strip = page.locator('.karat-strip, #karat-strip, [aria-label*="karat" i]').first();
    await expect(strip).toBeAttached();
  });

  test('trust banner is present and mentions methodology', async ({ page }) => {
    const methodology = page.locator('a[href*="methodology"]').first();
    await expect(methodology).toBeAttached();
  });

  test('country tiles section is present', async ({ page }) => {
    const tiles = page.locator('.country-tiles');
    await expect(tiles).toHaveCount(1);
    // At least one country tile should be in the DOM
    const tile = tiles.locator('.country-tile').first();
    await expect(tile).toBeAttached();
  });

  test('country search input is present and focusable', async ({ page }) => {
    const searchInput = page.locator('#country-search');
    await expect(searchInput).toBeAttached();
    await searchInput.focus();
    await expect(searchInput).toBeFocused();
  });

  test('country search filters tiles on input', async ({ page }) => {
    const searchInput = page.locator('#country-search');
    await expect(searchInput).toBeAttached();

    // Get initial count of visible tiles (excluding the "more" tile)
    const tilesWrap = page.locator('.country-tiles');
    const allTiles = tilesWrap.locator('a.country-tile:not(.country-tile--more)');
    const initialCount = await allTiles.count();
    expect(initialCount).toBeGreaterThan(1);

    // Type a specific query that should match exactly one country
    await searchInput.fill('UAE');
    // After filtering, fewer tiles should be visible (not filtered ones are hidden via CSS)
    const filteredOut = tilesWrap.locator('a.country-tile--filtered');
    await expect(filteredOut).not.toHaveCount(0);

    // Clear the search and all tiles should be visible again
    await searchInput.fill('');
    await expect(tilesWrap.locator('a.country-tile--filtered')).toHaveCount(0);
  });

  test('primary tool cards (tracker, calculator) have the primary variant class', async ({
    page,
  }) => {
    const trackerCard = page.locator('a.tool-card--primary[href*="tracker"]').first();
    await expect(trackerCard).toBeAttached();
    const calcCard = page.locator('a.tool-card--primary[href*="calculator"]').first();
    await expect(calcCard).toBeAttached();
  });

  test('markets section links to country pages', async ({ page }) => {
    const marketLink = page.locator('.market-card, .markets-grid a').first();
    await expect(marketLink).toBeAttached();
  });
});
