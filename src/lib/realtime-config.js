// 5 s active polling balances live UX with gold-api.com free-tier quota risk
// (see docs/operator-inputs-gold-provider-bakeoff.md). Freshness labels still
// tick every 1 s in the UI via startFreshnessTimer().
export const REALTIME_POLLING_DEFAULTS = {
  activePollMs: 5000,
  hiddenPollMs: 20000,
  fetchTimeoutMs: 4000,
  jitterMs: 250,
  backoffMs: [5000, 10000, 20000, 40000, 60000],
};
