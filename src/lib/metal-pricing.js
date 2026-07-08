/**
 * lib/metal-pricing.js — the resolution layer between the metals registry and the tools.
 *
 * Pure, side-effect-free. Given a metal, a purity grade, and the available spot prices, it returns a
 * single tagged result the UI can render honestly:
 *   • `{ state: 'ok', usdPerGram, aedPerGram, … }`  — priced (gold today; other metals once enabled)
 *   • `{ state: 'pending-data' }`                    — enabled metal but no spot feed yet
 *   • `{ state: 'disabled' }`                        — non-gold metal while the pilot is off
 *
 * Gold always prices (never gated) and uses the byte-identical `metalUsdPerGram` from the registry,
 * so wiring this into a tool cannot change gold's numbers. This module is not imported by any live
 * page yet — it is the safe building block the calculator/tracker will call once the silver pilot is
 * greenlit (see reports/metals/PHASE-33-silver-ui-plan.md).
 */

import { getMetal, metalUsdPerGram, usdToAedPerGram } from '../config/metals.js';
import { METALS_PILOT_ENABLED } from '../config/metals-flags.js';

/**
 * @param {string} metalKey                     'gold' | 'silver' | 'platinum' | 'palladium'
 * @param {string} purityCode                   grade code (karat number or fineness); falls back to the metal default
 * @param {Record<string, number|null|undefined>} spotByMetal  spot USD/oz per metal key (only gold today)
 * @param {{ pilotEnabled?: boolean }} [opts]   override the pilot flag (for tests)
 * @returns {{ state: 'ok'|'pending-data'|'disabled', metal: string, purity?: string, usdPerGram?: number|null, aedPerGram?: number|null }}
 */
export function resolveMetalGramPrice(metalKey, purityCode, spotByMetal = {}, opts = {}) {
  const pilotEnabled = opts.pilotEnabled ?? METALS_PILOT_ENABLED;
  const metal = getMetal(metalKey);
  const isGold = metal.key === 'gold';

  // Non-gold metals stay hidden until the pilot is enabled.
  if (!isGold && !pilotEnabled) return { state: 'disabled', metal: metal.key };

  const spot = spotByMetal ? spotByMetal[metal.key] : undefined;
  if (!Number.isFinite(spot)) return { state: 'pending-data', metal: metal.key };

  const grade =
    metal.purities.find((p) => p.code === purityCode) ||
    metal.purities.find((p) => p.code === metal.defaultPurity) ||
    metal.purities[0];
  const usdPerGram = metalUsdPerGram(spot, grade.purity);
  return {
    state: 'ok',
    metal: metal.key,
    purity: grade.code,
    usdPerGram,
    aedPerGram: usdToAedPerGram(usdPerGram),
  };
}

/** Metal keys the UI should offer right now — gold always, others only when the pilot is enabled. */
export function availableMetalKeys(opts = {}) {
  const pilotEnabled = opts.pilotEnabled ?? METALS_PILOT_ENABLED;
  return pilotEnabled ? ['gold', 'silver', 'platinum', 'palladium'] : ['gold'];
}
