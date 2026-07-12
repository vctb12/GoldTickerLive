// Portfolio boot cached-spot guard (Verified Work Queue item 10, audit D).
//
// The portfolio must value holdings from the canonical cached snapshot at boot
// instead of blocking first paint on the forced refresh round-trip (which also
// waits on the external FX API): the shared ticker already shows a cached price
// on the same page, so "Waiting for live prices…" next to it is a divergence.
//
// Encodes three promises:
//   1. EN + AR: with the local /data/gold_price.json snapshot available,
//      holdings valuations are non-empty shortly after load (bounded
//      auto-retrying waits — no sleeps) even while the forced refresh never
//      lands (its requests are aborted by the route below).
//   2. Honest freshness: when the source was the cached/fallback boot seed,
//      the badge never claims Live — it shows cached / stale (or the closed
//      overlay), always with the snapshot's real timestamp.
//   3. Honest empty path preserved: with empty storage AND a blocked /data
//      route, "Waiting for live prices…" stays — no fabricated values.
const { test, expect } = require('@playwright/test');

const KEY = 'gtl_portfolio_v1';
const MONEY_RE = /\d[\d,]*\.\d{2}/; // formatPrice always emits en-US digits
const WAITING_EN = 'Waiting for live prices…';
const WAITING_AR = 'بانتظار الأسعار الحية…';
// Never-Live states the cached boot seed may honestly render: cached/stale by
// age, or the shared market-closed overlay on weekends.
const HONEST_SEED_STATES = ['cached', 'stale', 'fallback', 'closed'];

const PORTFOLIO = {
  version: 1,
  currency: 'AED',
  holdings: [
    {
      id: 'h_spec_boot_1',
      label: 'Spec bangle',
      weightGrams: 20,
      karat: '22',
      purchaseDate: '2025-11-02',
      costTotal: 9000,
      costCurrency: 'AED',
      createdAt: '2025-11-02T10:00:00.000Z',
    },
  ],
};

// Service workers could satisfy /data requests outside page.route interception;
// block them so the routes below fully control the data plane.
test.use({ serviceWorkers: 'block' });

/**
 * Let the FIRST /data/gold_price.json read (the shell/seed canonical baseline)
 * succeed, then abort every later one — so the forced refresh can never land
 * and never upgrade the seed to Live. External FX is aborted outright. What
 * remains rendered is exactly the boot-seed state this spec asserts on.
 */
async function routeCachedOnly(page) {
  let goldRequests = 0;
  await page.route('**/data/gold_price.json*', (route) => {
    goldRequests += 1;
    if (goldRequests === 1) return route.continue();
    return route.abort();
  });
  await page.route('**/open.er-api.com/**', (route) => route.abort());
}

async function seedPortfolio(page) {
  await page.addInitScript(
    ([key, value]) => localStorage.setItem(key, JSON.stringify(value)),
    [KEY, PORTFOLIO]
  );
}

async function expectSeededValuation(page, waitingText) {
  const valueCard = page.locator('#portfolio-summary .portfolio-card').first();
  // Bounded auto-retrying wait: the seed resolves from the local snapshot in
  // well under this budget; no fixed sleeps.
  await expect(valueCard).toContainText(MONEY_RE, { timeout: 10000 });
  await expect(valueCard).not.toContainText(waitingText);

  // Per-holding reference value renders too (not the '—' placeholder).
  await expect(page.locator('#portfolio-holdings .portfolio-table tbody tr').first()).toContainText(
    MONEY_RE
  );

  // Spot badge carries the seeded price…
  await expect(page.locator('#portfolio-spot-price')).toContainText(/\$\d/);
  // …and the freshness label NEVER claims Live for a cached/fallback source,
  // while still carrying real metadata (never blank / not 'unavailable').
  const state = await page.locator('#portfolio-freshness').getAttribute('data-state');
  expect(HONEST_SEED_STATES, `freshness state "${state}" must be honest`).toContain(state);
}

test.describe('Portfolio boot seeds valuations from the cached canonical spot', () => {
  test('EN: holdings valued shortly after load; freshness never claims Live', async ({
    page,
    baseURL,
  }) => {
    await routeCachedOnly(page);
    await seedPortfolio(page);
    await page.goto((baseURL || '') + '/portfolio.html', { waitUntil: 'domcontentloaded' });
    await expectSeededValuation(page, WAITING_EN);
  });

  test('AR: holdings valued shortly after load; freshness never claims Live', async ({
    page,
    baseURL,
  }) => {
    await routeCachedOnly(page);
    await seedPortfolio(page);
    await page.goto((baseURL || '') + '/portfolio.html?lang=ar', {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expectSeededValuation(page, WAITING_AR);
  });

  test('honest path preserved: no snapshot + no cache keeps "Waiting for live prices…"', async ({
    page,
    baseURL,
  }) => {
    // Fresh context = empty storage (no gold cache). Block the /data route
    // entirely: the resolver has nothing honest to return, so no value may be
    // fabricated.
    let goldAborts = 0;
    await page.route('**/data/gold_price.json*', (route) => {
      goldAborts += 1;
      return route.abort();
    });
    await page.route('**/open.er-api.com/**', (route) => route.abort());
    await seedPortfolio(page); // holdings exist — only the price is missing

    await page.goto((baseURL || '') + '/portfolio.html', { waitUntil: 'domcontentloaded' });

    const valueCard = page.locator('#portfolio-summary .portfolio-card').first();
    await expect(valueCard).toContainText(WAITING_EN, { timeout: 10000 });

    // Deterministic settle signal instead of a sleep: the canonical baseline
    // round and the forced-refresh round each retry the data file 3 times —
    // once >= 6 aborts have happened, every boot fetch path has exhausted.
    await expect
      .poll(() => goldAborts, { timeout: 30000, message: 'both fetch rounds must exhaust' })
      .toBeGreaterThanOrEqual(6);

    // Still honestly waiting — no fabricated valuation, no fabricated badge.
    await expect(valueCard).toContainText(WAITING_EN);
    await expect(valueCard).not.toContainText(MONEY_RE);
    await expect(page.locator('#portfolio-spot-price')).toHaveText('—');
    const state = await page.locator('#portfolio-freshness').getAttribute('data-state');
    expect(['unavailable', 'closed'], `state "${state}" must not claim data`).toContain(state);
  });
});
