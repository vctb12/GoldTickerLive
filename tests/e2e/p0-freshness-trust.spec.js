// P0 freshness-trust regression. A static snapshot can retain fetch-time
// is_fresh:true / freshness_seconds:1 long after its observation timestamp.
// These browser tests prove that old data is never shown as Live / مباشر on
// the calculator or shops reference surfaces.
const { test, expect } = require('@playwright/test');

test.use({ serviceWorkers: 'block' });

const FIXED_MARKET_OPEN_NOW = Date.parse('2026-08-25T12:00:00.000Z');

function marketIsOpen(now = new Date()) {
  const day = now.getUTCDay();
  const minutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  return !(day === 6 || (day === 5 && minutes >= 21 * 60) || (day === 0 && minutes < 22 * 60));
}

function expectedState() {
  return marketIsOpen() ? 'stale' : 'closed';
}

function expectedLabel(lang, state) {
  return {
    en: { stale: 'Stale', closed: 'Closed' },
    ar: { stale: 'قديم', closed: 'مغلق' },
  }[lang][state];
}

function hasLiveClaim(text) {
  return /\bLive\b|مباشر/u.test(text || '');
}

function oldSnapshot() {
  const timestamp = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  return {
    xau_usd_per_oz: 3000,
    provider: 'gold-api.com',
    timestamp_utc: timestamp,
    fetched_at_utc: timestamp,
    // Deliberately frozen producer-time metadata. The UI must use timestamp_utc
    // against current time instead of reusing this as fresh render-time state.
    is_fresh: true,
    freshness_seconds: 1,
    max_freshness_seconds: 900,
    is_fallback: false,
  };
}

function delayedSnapshot() {
  const timestamp = new Date(FIXED_MARKET_OPEN_NOW - 45 * 60 * 1000).toISOString();
  return {
    xau_usd_per_oz: 3000,
    provider: 'gold-api.com',
    timestamp_utc: timestamp,
    fetched_at_utc: timestamp,
    // No producer freshness verdict: a 45-minute-old value is age-delayed,
    // not a live-fetch failure and therefore not a cached fallback.
    is_fresh: null,
    is_fallback: false,
  };
}

async function installFixedClock(page, nowMs) {
  await page.addInitScript((fixedNow) => {
    const RealDate = Date;
    class FixedDate extends RealDate {
      constructor(...args) {
        super(...(args.length ? args : [fixedNow]));
      }

      static now() {
        return fixedNow;
      }
    }
    Object.setPrototypeOf(FixedDate, RealDate);
    window.Date = FixedDate;
  }, nowMs);
}

async function installSnapshot(page, snapshot) {
  await page.route(/^https?:\/\/(?!localhost|127\.0\.0\.1)/, (route) => route.abort());
  await page.route('**/open.er-api.com/**', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        rates: { AED: 3.6725, USD: 1 },
        time_last_update_utc: new Date().toUTCString(),
        time_next_update_utc: new Date(Date.now() + 86_400_000).toUTCString(),
      }),
    })
  );
  await page.route('**/data/gold_price.json*', (route) =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify(snapshot) })
  );
}

async function installOldSnapshot(page) {
  await installSnapshot(page, oldSnapshot());
}

async function expectCalculatorNeverLive(page, { lang }) {
  const state = expectedState();
  const label = expectedLabel(lang, state);
  await expect(page.locator('#calc-freshness-badge-slot [data-freshness-state]')).toHaveAttribute(
    'data-freshness-state',
    state,
    { timeout: 10_000 }
  );
  const hero = page.locator('#calc-freshness-note');
  await expect(hero).toContainText(label);
  expect(hasLiveClaim(await hero.textContent())).toBe(false);
}

async function expectShopsNeverLive(page, { lang }) {
  const state = expectedState();
  const label = expectedLabel(lang, state);
  const chip = page.locator('#shops-ref-chip');
  await expect(chip).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('#shops-ref-dot')).toHaveClass(new RegExp(`shops-ref-dot--${state}`));
  const freshness = page.locator('#shops-ref-fresh');
  await expect(freshness).toContainText(label);
  expect(hasLiveClaim(await freshness.textContent())).toBe(false);
}

test('calculator EN desktop: old snapshot never claims Live', async ({ page, baseURL }) => {
  await installOldSnapshot(page);
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto((baseURL || '') + '/calculator.html', { waitUntil: 'domcontentloaded' });
  await expectCalculatorNeverLive(page, { lang: 'en' });
});

test('calculator AR/RTL at 360px: old snapshot never claims مباشر', async ({ page, baseURL }) => {
  await installOldSnapshot(page);
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto((baseURL || '') + '/calculator.html?lang=ar', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expectCalculatorNeverLive(page, { lang: 'ar' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true
  );
});

test('calculator forwards an age-delayed snapshot unchanged to ticker and spot bar', async ({
  page,
  baseURL,
}) => {
  await installFixedClock(page, FIXED_MARKET_OPEN_NOW);
  await installSnapshot(page, delayedSnapshot());
  await page.goto((baseURL || '') + '/calculator.html', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('#calc-freshness-badge-slot [data-freshness-state]')).toHaveAttribute(
    'data-freshness-state',
    'delayed',
    { timeout: 10_000 }
  );
  await expect(page.locator('#gold-ticker')).toHaveAttribute('data-freshness', 'delayed');
  await expect(page.locator('#spot-price-bar')).toHaveAttribute('data-freshness', 'delayed');
  await expect(page.locator('#gold-ticker [data-ticker-status-label]')).toHaveText('Delayed');
  await expect(page.locator('#spot-price-bar [data-spot-ts]')).toHaveAttribute('title', 'Delayed');
});

test('shops EN desktop: old reference snapshot never receives the live class', async ({
  page,
  baseURL,
}) => {
  await installOldSnapshot(page);
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto((baseURL || '') + '/shops.html', { waitUntil: 'domcontentloaded' });
  await expectShopsNeverLive(page, { lang: 'en' });
});

test('shops AR/RTL at 360px: old reference snapshot never claims مباشر', async ({
  page,
  baseURL,
}) => {
  await installOldSnapshot(page);
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto((baseURL || '') + '/shops.html?lang=ar', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expectShopsNeverLive(page, { lang: 'ar' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true
  );
});
