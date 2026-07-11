/**
 * visibility-refresh.js — one tested implementation of visibility-aware price
 * polling for the non-Tracker surfaces.
 *
 * Problem it solves: several tool/content pages refresh the canonical snapshot
 * on a fixed `setInterval`, which keeps hitting `/data/gold_price.json` every
 * `GOLD_REFRESH_MS` even while the tab is hidden — wasteful background traffic
 * that never reaches a user's eyes. The homepage-family pages (compare,
 * portfolio, heatmap, calculator) already guard this inline; this helper
 * extracts that proven pattern so market / dubai / shops / invest share ONE
 * implementation instead of four hand-rolled copies.
 *
 * Behaviour (matches the inline pattern in calculator.js):
 *   - Start: begin the interval only if the tab is currently visible.
 *   - Tab hidden  → clear the interval (stop polling).
 *   - Tab visible → run an immediate catch-up refresh, then restart the interval.
 *   - `pagehide`  → tear the interval down.
 *
 * It never performs an initial refresh on `start()` — callers already fetch
 * once before starting the loop, so a start-time fetch would double up. The
 * catch-up refresh happens only when a hidden tab returns to visible.
 *
 * The Tracker is intentionally NOT a caller: it runs its own multi-tier
 * realtime engine with `setVisibility()`; this helper is for the snapshot-based
 * surfaces only.
 *
 * @param {() => (void | Promise<void>)} refresh  invoked on each tick and on re-show
 * @param {{
 *   intervalMs: number,
 *   doc?: Document,
 *   win?: Window,
 * }} opts  `intervalMs` is required (callers pass `CONSTANTS.GOLD_REFRESH_MS`).
 *   `doc`/`win` are injectable for tests.
 * @returns {{ stop: () => void, isRunning: () => boolean }}
 */
export function startVisibilityAwareRefresh(refresh, { intervalMs, doc, win } = {}) {
  const documentRef = doc || (typeof document !== 'undefined' ? document : null);
  const windowRef = win || (typeof window !== 'undefined' ? window : null);

  if (typeof refresh !== 'function' || !Number.isFinite(intervalMs) || intervalMs <= 0) {
    // Nothing sane to schedule — return an inert controller so callers never
    // need to null-check.
    return { stop() {}, isRunning: () => false };
  }

  let timer = null;

  const isHidden = () => documentRef?.hidden === true;

  const startTimer = () => {
    if (timer == null) timer = setInterval(refresh, intervalMs);
  };

  const stopTimer = () => {
    if (timer != null) {
      clearInterval(timer);
      timer = null;
    }
  };

  const onVisibilityChange = () => {
    if (isHidden()) {
      stopTimer();
    } else if (timer == null) {
      // Returned to a visible tab after being paused — catch up immediately so
      // the user never stares at a value that went stale while hidden, then
      // resume the cadence.
      refresh();
      startTimer();
    }
  };

  const onPageHide = () => teardown();

  function teardown() {
    stopTimer();
    documentRef?.removeEventListener?.('visibilitychange', onVisibilityChange);
    windowRef?.removeEventListener?.('pagehide', onPageHide);
  }

  // Start paused if the page loaded in a hidden tab; otherwise begin polling.
  if (!isHidden()) startTimer();
  documentRef?.addEventListener?.('visibilitychange', onVisibilityChange);
  windowRef?.addEventListener?.('pagehide', onPageHide);

  return {
    stop: teardown,
    isRunning: () => timer != null,
  };
}
