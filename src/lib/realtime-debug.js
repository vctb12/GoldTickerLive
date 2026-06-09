/**
 * Debug gates for realtime SLO panel and engine verbose logging.
 */
export function isRealtimeDebugEnabled() {
  if (typeof location === 'undefined') return false;
  const params = new URLSearchParams(location.search);
  return params.get('debugFreshness') === '1' || params.get('debugSlo') === '1';
}
