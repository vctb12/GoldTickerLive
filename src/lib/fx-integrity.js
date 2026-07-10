/**
 * lib/fx-integrity.js — FX-rate integrity pass (Phase 52).
 *
 * `price-calculator.js` applies live USD→currency rates straight from the FX feed
 * (`rates[country.currency]`) behind only a truthiness check, while AED is always computed from the
 * fixed `CONSTANTS.AED_PEG` and deliberately excluded from the feed. That leaves two integrity gaps:
 *   1. a corrupted feed rate (0, negative, NaN, or an absurd magnitude) flows straight into a
 *      displayed price, and
 *   2. if the feed ever carried an AED rate, nothing would flag its drift from the fixed peg.
 *
 * This module sanitizes a rates map before it is applied: it drops untrustworthy rates (so a
 * currency shows *no* price rather than a corrupted one) and always forces AED to the peg. It is
 * pure, non-authoritative (it never invents a rate and never touches the peg/troy math), and
 * side-effect-free.
 */

import { CONSTANTS } from '../config/index.js';
import { isFeatureEnabled } from '../config/feature-flags.js';

const AED_PEG = CONSTANTS.AED_PEG; // 3.6725

/**
 * Plausible band for a USD→currency rate. The currencies this site shows all sit well inside it
 * (e.g. KWD ≈ 0.31, BHD ≈ 0.38 at the low end; IRR ≈ 42000, VND ≈ 24000 at the high end). Anything
 * outside is almost certainly a feed defect — 0, a negative, a NaN, a percentage, or a
 * decimal-place error — and must not touch a price.
 */
export const FX_RATE_MIN = 1e-4; // 0.0001
export const FX_RATE_MAX = 1e7; // 10,000,000

/** How far a feed's AED rate may drift from the fixed peg (percent) before it is flagged. */
export const AED_PEG_TOLERANCE_PCT = 0.5;

function round(value, dp = 4) {
  const f = 10 ** dp;
  return Math.round(value * f) / f;
}

/**
 * Validate a single USD→currency rate.
 * @param {*} rate
 * @param {{ min?: number, max?: number }} [opts]
 * @returns {{ ok: boolean, reason: 'ok'|'not-finite'|'non-positive'|'below-min'|'above-max' }}
 */
export function validateFxRate(rate, { min = FX_RATE_MIN, max = FX_RATE_MAX } = {}) {
  const r = Number(rate);
  if (!Number.isFinite(r)) return { ok: false, reason: 'not-finite' };
  if (r <= 0) return { ok: false, reason: 'non-positive' };
  if (r < min) return { ok: false, reason: 'below-min' };
  if (r > max) return { ok: false, reason: 'above-max' };
  return { ok: true, reason: 'ok' };
}

/**
 * Assess whether a feed-supplied AED rate agrees with the fixed peg. The peg is policy, not a feed
 * value — this only surfaces drift; it never lets the feed override the peg.
 * @param {*} feedAedRate
 * @param {{ peg?: number, tolerancePct?: number }} [opts]
 * @returns {{ present: boolean, matchesPeg: boolean, peg: number, feedRate: number|null, driftPct: number|null }}
 */
export function assessAedPeg(
  feedAedRate,
  { peg = AED_PEG, tolerancePct = AED_PEG_TOLERANCE_PCT } = {}
) {
  const r = Number(feedAedRate);
  if (feedAedRate == null || !Number.isFinite(r) || r <= 0) {
    return { present: false, matchesPeg: true, peg, feedRate: null, driftPct: null };
  }
  const driftPct = (Math.abs(r - peg) / peg) * 100;
  return {
    present: true,
    matchesPeg: driftPct <= Math.max(0, tolerancePct),
    peg,
    feedRate: r,
    driftPct: round(driftPct),
  };
}

/**
 * Sanitize a USD→currency rates map before it is applied to prices. Drops invalid rates (recording
 * why) and always forces AED to the fixed peg, regardless of the feed.
 *
 * @param {Record<string, number>|null} rates
 * @param {{ peg?: number, min?: number, max?: number, tolerancePct?: number }} [opts]
 * @returns {{ safe: Record<string, number>, rejected: Array<{currency:string, reason:string, value:*, driftPct?:number}>, aed: object }}
 */
export function sanitizeFxRates(rates, { peg = AED_PEG, min, max, tolerancePct } = {}) {
  const safe = {};
  const rejected = [];

  const aed = assessAedPeg(rates ? rates.AED : null, { peg, tolerancePct });
  // AED is always the fixed peg — never the feed value.
  safe.AED = peg;
  if (aed.present && !aed.matchesPeg) {
    rejected.push({
      currency: 'AED',
      reason: 'aed-peg-drift',
      value: aed.feedRate,
      driftPct: aed.driftPct,
    });
  }

  for (const [currency, value] of Object.entries(rates || {})) {
    if (currency === 'AED') continue; // handled above — peg wins
    const check = validateFxRate(value, { min, max });
    if (check.ok) {
      safe[currency] = Number(value);
    } else {
      rejected.push({ currency, reason: check.reason, value });
    }
  }

  return { safe, rejected, aed };
}

/** Whether the FX-integrity pass is enabled for the live price path (owner-gated, default OFF). */
export function isFxIntegrityEnabled() {
  return isFeatureEnabled('FX_INTEGRITY_ENABLED');
}
