// Gold-API.com terms prohibit abusive request rates. A single visible tab uses
// a responsible 5-second live cadence; hidden tabs slow down substantially and
// cross-tab leadership prevents N tabs from multiplying request volume.
export const REALTIME_POLLING_DEFAULTS = {
  activePollMs: 5000,
  livePollMs: 5000,
  staticPollMs: 30_000,
  fallbackPollMs: 60_000,
  hiddenPollMs: 60_000,
  fetchTimeoutMs: 2500,
  jitterMs: 250,
  backoffMs: [2500, 5000, 5000],
  streamUrl: null,
};

/** Wire headlines + unified history — decoupled from spot poll loop. */
export const WIRE_HISTORY_REFRESH_MS = 60_000;

/** Product SLO: user-visible Live label must not exceed this age. */
export const REALTIME_LIVE_MAX_AGE_MS = 5000;
