export const REALTIME_POLLING_DEFAULTS = {
  activePollMs: 1000,
  hiddenPollMs: 5000,
  fetchTimeoutMs: 4000,
  jitterMs: 100,
  backoffMs: [1000, 2000, 5000, 10000, 30000],
};
