// 1 s polling when gold-api.com is the active source (real-time hero updates).
// Static JSON / LBMA / cache fallbacks use slower cadences via resolveProviderPollMs()
// in the pricing engine. Freshness age text still ticks every 1 s in the UI.
export const REALTIME_POLLING_DEFAULTS = {
  activePollMs: 1000,
  livePollMs: 1000,
  staticPollMs: 30_000,
  fallbackPollMs: 60_000,
  hiddenPollMs: 20_000,
  fetchTimeoutMs: 4000,
  jitterMs: 250,
  backoffMs: [2000, 5000, 10_000, 20_000, 40_000, 60_000],
};
