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
