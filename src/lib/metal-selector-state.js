/**
 * lib/metal-selector-state.js — metal + grade selection state / URL model (Phase 59, Theme B).
 *
 * The multi-metal view (Phases 56–58) needs to remember *which* metal and purity grade the user is
 * looking at, and round-trip it through the URL — exactly like `calculator/url-state.js` does for the
 * calculator, but validated against the metals registry. This module is that state layer: every
 * selection is normalized against `metals.js` (gold is the default metal; each metal's default grade
 * is the fallback), so a stale or hand-edited URL can never select a metal/grade that doesn't exist.
 *
 * Pure and side-effect-free. It selects *what to show*; it does not price anything, so the peg /
 * troy-oz / framing are untouched and gold's numbers are unaffected.
 */

import { getMetal, metalKeys, PRIMARY_METAL } from '../config/metals.js';

/**
 * Clamp an arbitrary metal/grade pair to a valid selection. Unknown metal → gold; a grade that is
 * not one of the chosen metal's purities → that metal's default grade.
 *
 * @param {{ metal?: string, grade?: string }} [selection]
 * @returns {{ metal: string, grade: string }}
 */
export function normalizeMetalSelection({ metal, grade } = {}) {
  const key = metalKeys().includes(String(metal)) ? String(metal) : PRIMARY_METAL;
  const m = getMetal(key);
  const gradeCode = m.purities.some((p) => p.code === String(grade))
    ? String(grade)
    : m.defaultPurity;
  return { metal: key, grade: gradeCode };
}

/**
 * Serialize a selection to a query string, omitting defaults so gold at its default grade yields a
 * clean URL (`''`).
 *
 * @param {{ metal?: string, grade?: string }} selection
 * @returns {string}  e.g. '?metal=silver&grade=925', or '' for the gold default.
 */
export function serializeMetalSelection(selection) {
  const { metal, grade } = normalizeMetalSelection(selection);
  const params = new URLSearchParams();
  if (metal !== PRIMARY_METAL) params.set('metal', metal);
  if (grade !== getMetal(metal).defaultPurity) params.set('grade', grade);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

/**
 * Parse a query string back into a validated selection.
 * @param {string} search
 * @returns {{ metal: string, grade: string }}
 */
export function parseMetalSelection(search) {
  const params = new URLSearchParams(search || '');
  return normalizeMetalSelection({ metal: params.get('metal'), grade: params.get('grade') });
}

/**
 * When the user switches metals, keep the current grade if the new metal offers it, otherwise fall
 * back to the new metal's default grade (e.g. gold '22' → silver has no '22' → silver '999'; but
 * silver '999' → platinum keeps '999' since platinum also offers it).
 *
 * @param {string} metalKey
 * @param {string} currentGrade
 * @returns {string} the reconciled grade code
 */
export function reconcileGradeForMetal(metalKey, currentGrade) {
  return normalizeMetalSelection({ metal: metalKey, grade: currentGrade }).grade;
}
