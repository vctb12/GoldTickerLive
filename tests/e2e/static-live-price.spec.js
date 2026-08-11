const { test, expect } = require('@playwright/test');

test.use({ serviceWorkers: 'block' });

test('static Pages build updates the displayed price without a redeploy', async ({ page }) => {
  let requestCount = 0;
  await page.route('https://api.gold-api.com/price/XAU', async (route) => {
    requestCount += 1;
    const price = requestCount === 1 ? 4712.1 : 4713.4;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ price, updatedAt: new Date().toISOString() }),
    });
  });

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const price = page.locator('#hlc-price');
  await expect.poll(async () => price.textContent(), { timeout: 10_000 }).toContain('4,712.10');

  await expect.poll(async () => price.textContent(), { timeout: 12_000 }).toContain('4,713.40');
  expect(requestCount).toBeGreaterThanOrEqual(2);
  await expect(page.locator('#hlc-updated')).toContainText(/Live|Gold-API/i);
});
