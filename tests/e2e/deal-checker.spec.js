/**
 * Deal Intelligence Lab browser coverage.
 * The calculation itself is covered by node:test; this file protects the
 * accessible page shell, bilingual direction, and URL-state handoff.
 */
const { test, expect } = require('@playwright/test');

test.describe('Deal Intelligence Lab', () => {
  test('loads, accepts quote inputs, and renders a neutral comparison', async ({ page }) => {
    await page.goto('/deal-checker.html?lang=en', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main#main-content')).toBeVisible();
    await expect(page.locator('#deal-title')).toContainText(/gold quote/i);
    await page.locator('#deal-quoted-total').fill('2500');
    await page.locator('#deal-gross-weight').fill('10');
    await page.locator('#deal-making-mode').selectOption('included');
    await page.locator('#deal-premium-mode').selectOption('included');
    await page.locator('#deal-tax-mode').selectOption('included');
    await expect(page.locator('#deal-reference-value')).not.toHaveText('—');
    await expect(page.locator('#deal-status-explain')).toContainText(/configured benchmark/i);
    await expect(page.locator('body')).not.toContainText(/good|bad|scam/i);
  });

  test('preserves inputs in URL state without exposing the shop label', async ({ page }) => {
    await page.goto('/deal-checker.html?lang=en', { waitUntil: 'domcontentloaded' });
    await page.locator('#deal-quoted-total').fill('2750');
    await page.locator('#deal-gross-weight').fill('12');
    await page.locator('#deal-shop-label').fill('Private showroom note');
    const url = new URL(page.url());
    expect(url.searchParams.get('state')).toBeTruthy();
    expect(url.search).not.toContain('Private%20showroom%20note');
  });

  test('renders Arabic RTL controls', async ({ page }) => {
    await page.goto('/deal-checker.html?lang=ar', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('#deal-title')).toContainText('الذهب');
    await expect(page.locator('#deal-quoted-total')).toHaveAccessibleName(/العرض|إجمالي/);
  });

  test('keeps the form usable at a 390px mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/deal-checker.html?lang=en', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#deal-form')).toBeVisible();
    await expect(page.locator('#deal-submit')).toBeVisible();
    await expect(page.locator('#deal-results-title')).toBeVisible();
  });

  test('includes breadcrumb structured data', async ({ page }) => {
    await page.goto('/deal-checker.html?lang=en', { waitUntil: 'domcontentloaded' });
    const schemas = page.locator('script[type="application/ld+json"]');
    let found = false;
    for (let i = 0; i < (await schemas.count()); i++) {
      const text = await schemas.nth(i).textContent();
      if (text?.includes('BreadcrumbList') && text.includes('deal-checker.html')) found = true;
    }
    expect(found).toBe(true);
  });
});
