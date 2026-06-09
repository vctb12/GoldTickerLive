// 1 s polling when a live-lane provider is active (real-time hero updates).
// Static JSON / LBMA / cache fallbacks use slower cadences via resolveProviderPollMs().
// Failure backoff caps at 5 s while the tab is visible (PR-B Phase 4).
export const REALTIME_POLLING_DEFAULTS = {
  activePollMs: 1000,
  livePollMs: 1000,
  staticPollMs: 30_000,
  fallbackPollMs: 60_000,
  hiddenPollMs: 5000,
  fetchTimeoutMs: 4000,
  jitterMs: 250,
  backoffMs: [1000, 2000, 3000, 5000],
};

/** Wire headlines + unified history — decoupled from spot poll loop. */
export const WIRE_HISTORY_REFRESH_MS = 60_000;

/** Product SLO: user-visible Live label must not exceed this age. */
export const REALTIME_LIVE_MAX_AGE_MS = 5000;
