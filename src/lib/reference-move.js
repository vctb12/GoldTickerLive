/**
 * Reference-movement observation — pure, side-effect-free.
 *
 * Compares a CURRENT reference figure against a PRIOR recorded reference and
 * reports direction + magnitude with the prior record's timestamp, so any
 * surface can honestly say "the reference is X% above/below the value recorded
 * at <time>". This is deliberately framed as an OBSERVATION of the published
 * reference figure — it is not a forecast, not intraday OHLC, and never states a
 * cause. Callers must render the real window (from `ts`), never a fabricated
 * "24h", and never colour-only direction (see the freshness/honesty contract).
 *
 * Shared by market.html's worked example (3.1) and reused by the wider
 * price-change explainability pass (3.2).
 */

// Below this absolute percentage the two figures are the same for display
// purposes — we say "virtually unchanged" (neutral) rather than drawing a
// misleading ±0.0x% arrow on rounding noise.
export const MOVE_FLAT_PCT = 0.05;

/**
 * @param {number} current  current reference value (same unit as `prior`)
 * @param {number} prior    last recorded reference value
 * @param {string|null|undefined} ts  ISO timestamp the prior reference was recorded at
 * @returns {{current:number, prior:number, ts:string, change:number, pct:number,
 *            direction:'up'|'down'|'neutral'}|null}
 *   `null` unless BOTH values are finite positives AND a timestamp is present —
 *   we never show a change without an honest window.
 */
export function referenceMove(current, prior, ts) {
  if (!Number.isFinite(current) || current <= 0) return null;
  if (!Number.isFinite(prior) || prior <= 0) return null;
  if (!ts || typeof ts !== 'string') return null;

  const change = current - prior;
  const pct = (change / prior) * 100;
  const direction = Math.abs(pct) < MOVE_FLAT_PCT ? 'neutral' : change > 0 ? 'up' : 'down';
  return { current, prior, ts, change, pct, direction };
}
