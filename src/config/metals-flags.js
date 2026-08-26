/**
 * config/metals-flags.js — pilot gate for the non-gold metals UI.
 *
 * Silver/platinum/palladium are OFF until (a) the owner adds their spot feed to the price pipeline
 * (owner-gated `gold-price-fetch.yml` → `data/*_price.json`) and (b) this flag is flipped. Gold is
 * never gated by this flag — it is always live.
 *
 * Kept a plain constant so the metals UI code has a single, testable source of truth and the build
 * tree-shakes the non-gold branches while the flag is false.
 */

/** Master switch for the non-gold metals UI. MUST stay false until live silver data exists. */
export const METALS_PILOT_ENABLED = false;

/**
 * Resolve the UI gate. Production stays off until the owner-approved feed pipeline exists; a
 * deliberate query switch is accepted only on a local development host for visual QA.
 */
export function isMetalsPilotEnabled({ hostname, search } = {}) {
  if (METALS_PILOT_ENABLED) return true;
  const host = String(hostname ?? globalThis.location?.hostname ?? '').toLowerCase();
  const query = String(search ?? globalThis.location?.search ?? '');
  const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1';
  return isLocal && new URLSearchParams(query).get('metals') === 'preview';
}
