// @ts-check
/**
 * Homepage visibility guard (Verified Work Queue item 20 — HOME half).
 *
 * Regression lock: hidden tabs must NOT keep the homepage's 90 s
 * `seedCanonicalPrice()+fetchLiveData()` refresh interval nor the 1 s
 * freshness-label ticker alive. Both now run through the shared
 * `startVisibilityAwareRefresh` helper (`src/lib/visibility-refresh.js`):
 *   - tab hidden  → the interval is cleared (no background fetches / DOM churn)
 *   - tab visible → one immediate catch-up refresh, then the cadence restarts
 *
 * Determinism (no 90 s waits, no arbitrary sleeps):
 *   - An init script wraps `setInterval`/`clearInterval` so the test can assert
 *     the exact lifecycle of the 90 000 ms and 1 000 ms home intervals.
 *   - Page visibility is emulated by overriding `document.hidden` /
 *     `document.visibilityState` and dispatching `visibilitychange`
 *     (`dispatchEvent` runs listeners synchronously, so every assertion about
 *     "what the handler did" is made inside a single synchronous
 *     `page.evaluate` block — no interleaving with the realtime engine's
 *     macrotask-scheduled polls is possible).
 *   - The visible-catch-up fetch is attributed by tagging fetches initiated
 *     *synchronously during* the `visibilitychange` dispatch: the canonical
 *     seed's call chain (`seedCanonicalPrice → getCanonicalSpot(force) →
 *     fetchGold → fetchWithTimeout → fetch('/data/gold_price.json?t=…')`)
 *     invokes `fetch` with no intervening timer/await suspension, while the
 *     untouched realtime engine schedules its visibility-recovery poll via
 *     `setTimeout` and therefore can never be mis-attributed.
 *
 * The realtime engine's own `setVisibility` handling (home.js
 * `initRealtimeEngine`) is intentionally NOT asserted here — it predates this
 * guard and keeps its behavior.
 */
const { test, expect } = require('@playwright/test');

const REFRESH_MS = 90_000; // CONSTANTS.GOLD_REFRESH_MS (owner-gated constant, read-only)
const TICKER_MS = 1_000; // freshness-label ticker cadence in home.js

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    // Interval registry: every setInterval registration on the page, with its
    // delay and live/cleared state. clearInterval marks the record inactive
    // and still clears the real timer.
    const registry = [];
    // @ts-ignore - test instrumentation
    window.__gtlIntervals = registry;
    const origSetInterval = window.setInterval.bind(window);
    const origClearInterval = window.clearInterval.bind(window);
    // @ts-ignore
    window.setInterval = function (fn, delay, ...args) {
      const id = origSetInterval(fn, delay, ...args);
      registry.push({ id, delay: Number(delay), active: true });
      return id;
    };
    // @ts-ignore
    window.clearInterval = function (id) {
      const rec = registry.find((r) => r.id === id && r.active);
      if (rec) rec.active = false;
      return origClearInterval(id);
    };

    // Fetch log: URL + the synchronous attribution tag active at call time.
    const fetchLog = [];
    // @ts-ignore
    window.__gtlFetchLog = fetchLog;
    const origFetch = window.fetch.bind(window);
    // @ts-ignore
    window.fetch = function (input, init) {
      const url = typeof input === 'string' ? input : (input && input.url) || String(input);
      // @ts-ignore
      fetchLog.push({ url, tag: window.__gtlTag || null });
      return origFetch(input, init);
    };

    // Visibility emulation: shadow the Document.prototype getters on the
    // instance and fire visibilitychange synchronously.
    // @ts-ignore
    window.__gtlSetVisibility = function (hidden) {
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => hidden,
      });
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => (hidden ? 'hidden' : 'visible'),
      });
      document.dispatchEvent(new Event('visibilitychange'));
    };
  });
});

/** Wait until the canonical seed has populated the nav pill (goldPrice set). */
async function waitForSeed(page) {
  await page.waitForFunction(() => {
    const xau = document.querySelector('[data-nav-xau]');
    return !!xau && /\$\s?\d/.test(xau.textContent || '');
  });
  // state:'attached' — the dot span can be display-hidden at some viewports,
  // but the freshness tick still rewrites its classes.
  await page.waitForSelector('.nav-price-pill__dot', { state: 'attached' });
}

function intervalSnapshot(page) {
  return page.evaluate(
    ([refreshMs, tickerMs]) => {
      // @ts-ignore
      const all = window.__gtlIntervals;
      return {
        activeRefresh: all.filter((r) => r.delay === refreshMs && r.active).length,
        activeTicker: all.filter((r) => r.delay === tickerMs && r.active).length,
      };
    },
    [REFRESH_MS, TICKER_MS]
  );
}

async function runGuardScenario(page, path) {
  await page.goto(path, { waitUntil: 'load' });
  await waitForSeed(page);

  // 1. Visible baseline: exactly one live 90 s refresh interval and the 1 s
  //    freshness ticker are running.
  const visible = await intervalSnapshot(page);
  expect(visible.activeRefresh, '90s refresh interval runs while visible').toBe(1);
  expect(visible.activeTicker, '1s freshness ticker runs while visible').toBe(1);

  // 2. Hide the tab: both intervals must be cleared synchronously by the
  //    visibilitychange handlers (assertion made in the same evaluate — no
  //    other page task can interleave).
  const afterHide = await page.evaluate(
    ([refreshMs, tickerMs]) => {
      // @ts-ignore
      window.__gtlSetVisibility(true);
      // @ts-ignore
      const all = window.__gtlIntervals;
      return {
        activeRefresh: all.filter((r) => r.delay === refreshMs && r.active).length,
        activeTicker: all.filter((r) => r.delay === tickerMs && r.active).length,
      };
    },
    [REFRESH_MS, TICKER_MS]
  );
  expect(afterHide.activeRefresh, 'hidden tab clears the 90s refresh interval').toBe(0);
  expect(afterHide.activeTicker, 'hidden tab clears the 1s freshness ticker').toBe(0);

  // 3. Return to visible: synchronously during the dispatch we must observe
  //    (a) the catch-up canonical fetch, (b) an immediate freshness repaint
  //    (nav pill dot classes rewritten), and (c) both intervals restarted.
  const afterShow = await page.evaluate(
    ([refreshMs, tickerMs]) => {
      const dot = document.querySelector('.nav-price-pill__dot');
      if (!dot) return { error: 'nav pill dot missing' };
      // Sentinels: the freshness tick's updateNavPillDot() removes all three
      // modifier classes and re-adds at most one, so if the tick ran, at most
      // one of these survives.
      dot.classList.add('gtl-dot--cached', 'gtl-dot--stale', 'gtl-dot--fallback');

      // @ts-ignore
      const fetchLog = window.__gtlFetchLog;
      // @ts-ignore
      window.__gtlTag = 'visible-dispatch';
      // @ts-ignore
      window.__gtlSetVisibility(false);
      // @ts-ignore
      window.__gtlTag = null;

      const catchupGoldFetches = fetchLog.filter(
        (f) => f.tag === 'visible-dispatch' && f.url.includes('/data/gold_price.json')
      ).length;
      const sentinelsLeft = ['gtl-dot--cached', 'gtl-dot--stale', 'gtl-dot--fallback'].filter((c) =>
        dot.classList.contains(c)
      ).length;
      // @ts-ignore
      const all = window.__gtlIntervals;
      return {
        error: null,
        catchupGoldFetches,
        sentinelsLeft,
        activeRefresh: all.filter((r) => r.delay === refreshMs && r.active).length,
        activeTicker: all.filter((r) => r.delay === tickerMs && r.active).length,
      };
    },
    [REFRESH_MS, TICKER_MS]
  );
  expect(afterShow.error).toBeNull();
  expect(
    afterShow.catchupGoldFetches,
    'returning to visible fires one immediate canonical catch-up fetch'
  ).toBe(1);
  expect(
    afterShow.sentinelsLeft,
    'freshness label/dot repaints immediately on return to visible'
  ).toBeLessThanOrEqual(1);
  expect(afterShow.activeRefresh, '90s refresh interval restarts, exactly once').toBe(1);
  expect(afterShow.activeTicker, '1s freshness ticker restarts, exactly once').toBe(1);
}

test.describe('home visibility guard — hidden tabs stop fetching', () => {
  test('EN: 90s refresh + 1s ticker pause while hidden, catch up on return', async ({ page }) => {
    await runGuardScenario(page, '/');
  });

  test('AR: same guard behavior on the Arabic homepage', async ({ page }) => {
    await runGuardScenario(page, '/?lang=ar');
  });
});
