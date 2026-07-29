// @ts-check
// UAE Historical Karat Chart — visual + interaction smoke tests.
// Serves built dist (see CI). Captures evidence screenshots to reports/screenshots/uae-hist-chart/.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const SHOT_DIR = path.join(__dirname, '../../reports/screenshots/uae-hist-chart');
const DAILY_FIXTURE = path.join(
  __dirname,
  '../fixtures/gold-api-history/xau-usd-daily.fixture.json'
);

async function installDailyHistoryRoute(page) {
  const body = fs.readFileSync(DAILY_FIXTURE, 'utf8');
  await page.route('**/data/historical/xau-usd-daily.json', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body,
    })
  );
}

async function scrollToChart(page) {
  const section = page.locator('#home-chart-section, .home-chart-section').first();
  await section.scrollIntoViewIfNeeded();
  await page.waitForSelector('#uae-hist-chart-root .uae-hist-chart__canvas', {
    timeout: 30000,
  });
  // Wait for chart library + data
  await page.waitForFunction(
    () => {
      const canvas = document.querySelector('#uae-hist-canvas');
      return canvas && !canvas.classList.contains('uae-hist-chart__canvas--loading');
    },
    null,
    { timeout: 30000 }
  );
}

async function setTheme(page, theme) {
  await page.evaluate((t) => {
    const prefs = JSON.parse(localStorage.getItem('user_prefs') || '{}');
    prefs.theme = t;
    localStorage.setItem('user_prefs', JSON.stringify(prefs));
    document.documentElement.setAttribute('data-theme', t);
  }, theme);
}

async function setLang(page, lang) {
  await page.evaluate((l) => {
    const prefs = JSON.parse(localStorage.getItem('user_prefs') || '{}');
    prefs.lang = l;
    localStorage.setItem('user_prefs', JSON.stringify(prefs));
    document.documentElement.lang = l;
    document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
  }, lang);
}

async function capture(page, name) {
  fs.mkdirSync(SHOT_DIR, { recursive: true });
  await page.screenshot({
    path: path.join(SHOT_DIR, `${name}.png`),
    fullPage: false,
  });
}

test.describe('UAE Historical Karat Chart', () => {
  test.beforeAll(() => {
    fs.mkdirSync(SHOT_DIR, { recursive: true });
  });

  test.beforeEach(async ({ page }) => {
    await page.route(/^https?:\/\/(?!localhost|127\.0\.0\.1)/, (route) => route.abort());
    await installDailyHistoryRoute(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/', { waitUntil: 'load' });
  });

  test('renders coverage and stale badge with chart data', async ({ page }) => {
    await scrollToChart(page);
    await expect(page.locator('#uae-hist-coverage')).toBeVisible();
    await expect(page.locator('#uae-hist-freshness-badge')).toBeVisible();
    await expect(page.locator('#uae-hist-range-subtitle')).toBeVisible();
    await expect(page.locator('.uae-hist-chart__summary-value').first()).toContainText(/AED\/g|درهم\/غ/);
    await capture(page, 'en-light-desktop-6m-line');
  });

  test('English dark desktop', async ({ page }) => {
    await setTheme(page, 'dark');
    await page.reload({ waitUntil: 'load' });
    await scrollToChart(page);
    await capture(page, 'en-dark-desktop-6m-line');
  });

  test('Arabic light desktop', async ({ page }) => {
    await setLang(page, 'ar');
    await page.reload({ waitUntil: 'load' });
    await scrollToChart(page);
    const source = page.locator('#uae-hist-source');
    const text = await source.textContent();
    expect(text).not.toMatch(/Daily reference observations|Mixed daily/);
    expect(text).toMatch(/gold-api\.com|متوسط XAU/);
    await capture(page, 'ar-light-desktop-6m-line');
  });

  test('Arabic dark desktop', async ({ page }) => {
    await setLang(page, 'ar');
    await setTheme(page, 'dark');
    await page.reload({ waitUntil: 'load' });
    await scrollToChart(page);
    await capture(page, 'ar-dark-desktop-6m-line');
  });

  test('mobile 390px English', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload({ waitUntil: 'load' });
    await scrollToChart(page);
    await capture(page, 'en-mobile-390-6m-line');
  });

  test('range and mode controls', async ({ page }) => {
    await scrollToChart(page);
    for (const range of ['1M', '3M', '6M', '12M']) {
      await page.locator(`.uae-hist-chart__range-btn[data-range="${range}"]`).click();
      await page.waitForTimeout(300);
      await capture(page, `en-light-range-${range.toLowerCase()}-line`);
    }
    await page.locator('.uae-hist-chart__mode-btn[data-mode="area"]').click();
    await page.waitForTimeout(300);
    await capture(page, 'en-light-range-12m-area');
  });

  test('table expand and legend toggle', async ({ page }) => {
    await scrollToChart(page);
    const more = page.locator('#uae-hist-table-more');
    if (await more.isVisible()) {
      await more.click();
      await capture(page, 'en-light-table-expanded');
    }
    await page.locator('.uae-hist-chart__legend-btn[data-karat="22"]').click();
    await capture(page, 'en-light-legend-hidden-22k');
  });
});
