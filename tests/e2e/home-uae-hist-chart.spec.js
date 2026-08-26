// @ts-check
// UAE Historical Karat Chart — visual + interaction smoke tests.
// Serves built dist (see CI). Captures evidence screenshots to reports/screenshots/uae-hist-chart/.
const { createHash } = require('node:crypto');
const { test, expect } = require('@playwright/test');

function hashNormalizedRecords(records) {
  return createHash('sha256').update(JSON.stringify(records)).digest('hex');
}
const fs = require('fs');
const path = require('path');

const SHOT_DIR = path.join(__dirname, '../../reports/screenshots/uae-hist-chart');
const DAILY_FIXTURE = path.join(
  __dirname,
  '../fixtures/gold-api-history/xau-usd-daily.live-fixture.json'
);

// Route-mocked reload states must not be satisfied by the production service-worker cache.
test.use({ serviceWorkers: 'block' });

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
    await expect(page.locator('.uae-hist-chart__summary-value').first()).toContainText(
      /AED\/g|درهم\/غ/
    );
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

  test('tooltip visible on chart hover', async ({ page }) => {
    await scrollToChart(page);
    const canvas = page.locator('#uae-hist-canvas');
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width * 0.55, box.y + box.height * 0.45);
      await page.waitForTimeout(400);
    }
    await expect(page.locator('#uae-hist-tooltip')).toBeVisible();
    await capture(page, 'en-light-tooltip-visible');
  });

  test('mobile 390px Arabic', async ({ page }) => {
    await setLang(page, 'ar');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload({ waitUntil: 'load' });
    await scrollToChart(page);
    await capture(page, 'ar-mobile-390-6m-line');
  });

  test('loading state before data resolves', async ({ page }) => {
    let release;
    const gate = new Promise((resolve) => {
      release = resolve;
    });
    const body = fs.readFileSync(DAILY_FIXTURE, 'utf8');
    await page.unroute('**/data/historical/xau-usd-daily.json');
    await page.route('**/data/historical/xau-usd-daily.json', async (route) => {
      await gate;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body,
      });
    });
    await page.reload({ waitUntil: 'load' });
    const section = page.locator('#home-chart-section, .home-chart-section').first();
    await section.scrollIntoViewIfNeeded();
    await page.waitForSelector('#uae-hist-canvas.uae-hist-chart__canvas--loading', {
      timeout: 10000,
    });
    await capture(page, 'en-light-loading-state');
    release();
    await page.waitForFunction(
      () => {
        const canvas = document.querySelector('#uae-hist-canvas');
        return canvas && !canvas.classList.contains('uae-hist-chart__canvas--loading');
      },
      null,
      { timeout: 30000 }
    );
  });

  test('stale dataset disclosure', async ({ page }) => {
    const body = fs.readFileSync(DAILY_FIXTURE, 'utf8');
    const doc = JSON.parse(body);
    doc.records = doc.records.filter((r) => r.date <= '2026-07-24');
    doc.coverage.start = doc.records[0]?.date;
    doc.coverage.end = '2026-07-24';
    doc.coverage.calendarAgeDays = 5;
    doc.coverage.recordCount = doc.records.length;
    doc.acceptedRecordCount = doc.records.length;
    doc.normalizedRecordsSha256 = hashNormalizedRecords(doc.records);
    await page.unroute('**/data/historical/xau-usd-daily.json');
    await page.route('**/data/historical/xau-usd-daily.json', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(doc),
      })
    );
    await page.reload({ waitUntil: 'load' });
    await scrollToChart(page);
    await expect(page.locator('#uae-hist-freshness-badge')).toContainText(/stale|قديمة/i);
    await capture(page, 'en-light-stale-state');
  });

  test('unavailable and retry state', async ({ page }) => {
    let attempt = 0;
    const body = fs.readFileSync(DAILY_FIXTURE, 'utf8');
    await page.unroute('**/data/historical/xau-usd-daily.json');
    await page.route('**/data/historical/xau-usd-daily.json', (route) => {
      attempt += 1;
      if (attempt === 1) {
        return route.fulfill({ status: 404, body: 'not found' });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body,
      });
    });
    await page.reload({ waitUntil: 'load' });
    await page.locator('#home-chart-section, .home-chart-section').first().scrollIntoViewIfNeeded();
    await page.waitForSelector('#uae-hist-retry', { timeout: 30000 });
    await capture(page, 'en-light-unavailable-error');
    await page.locator('#uae-hist-retry').click({ force: true });
    await page.waitForFunction(
      () => {
        const canvas = document.querySelector('#uae-hist-canvas');
        return canvas && !canvas.classList.contains('uae-hist-chart__canvas--loading');
      },
      null,
      { timeout: 30000 }
    );
    await capture(page, 'en-light-retry-success');
  });

  test('language switch preserves chart state', async ({ page }) => {
    await scrollToChart(page);
    await page.locator('.uae-hist-chart__range-btn[data-range="3M"]').click();
    await page.locator('.uae-hist-chart__mode-btn[data-mode="area"]').click();
    await page.locator('#nav-lang-toggle').click();
    await page.waitForTimeout(600);
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await expect(page.locator('#uae-hist-range-subtitle')).toBeVisible();
    await capture(page, 'ar-light-lang-switch-3m-area');
  });
});
