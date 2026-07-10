/**
 * lib/metal-comparison.js — multi-metal comparison view-model (Phase 56, Theme B).
 *
 * The building blocks exist (`metals.js` registry, `resolveMetalGramPrice`) but nothing renders a
 * side-by-side precious-metals view yet. This module builds that view-model: one honest row per metal
 * (gold + silver / platinum / palladium) at its default grade, tagged with a truthful state —
 * `ok` (has a spot feed), `pending-data` (enabled but no feed yet), or `disabled` (pilot off). It
 * never fabricates a non-gold price: metals without a feed carry `null` prices and a `pending-data`
 * state, so the table lights up automatically once the owner adds the non-gold spot feeds.
 *
 * Fully wired but gated by `METALS_PILOT_ENABLED` (the master switch for the non-gold metals UI) —
 * `renderMetalComparison` returns '' while the pilot is off, so nothing mounts by default. Gold's
 * numbers come from the same `resolveMetalGramPrice` path and are byte-identical to the live site;
 * the peg / troy-oz / framing are untouched.
 */

import { getMetal, metalKeys } from '../config/metals.js';
import { resolveMetalGramPrice } from './metal-pricing.js';
import { METALS_PILOT_ENABLED } from '../config/metals-flags.js';

const DISCLAIMER = {
  en: 'Spot-linked reference estimates per gram — not retail pricing and not financial advice. Metals without a live feed show as awaiting data.',
  ar: 'تقديرات مرجعية للسعر لكل جرام مرتبطة بالسعر الفوري — وليست سعر تجزئة ولا نصيحة مالية. تظهر المعادن التي لا يتوفر لها تغذية مباشرة بحالة "بانتظار البيانات".',
};

function pickLang(lang) {
  return lang === 'ar' ? 'ar' : 'en';
}

/**
 * Keep only finite, positive spot values so a metal with a missing / corrupt feed degrades to
 * `pending-data` rather than a fabricated price. Returns a clean `spotByMetal` map.
 * @param {Record<string, unknown>} raw
 * @returns {Record<string, number>}
 */
export function normalizeSpotMap(raw = {}) {
  const clean = {};
  for (const [key, value] of Object.entries(raw || {})) {
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) clean[key] = n;
  }
  return clean;
}

/**
 * Build the multi-metal comparison model.
 *
 * @param {Record<string, number>} spotByMetal  Spot USD/oz per metal key (only gold today).
 * @param {{ pilotEnabled?: boolean, lang?: 'en'|'ar', purityByMetal?: Record<string,string> }} [options]
 * @returns {{ pilotEnabled: boolean, rows: object[], disclaimer: string }}
 */
export function buildMetalComparison(spotByMetal = {}, options = {}) {
  const pilotEnabled = options.pilotEnabled ?? METALS_PILOT_ENABLED;
  const lang = pickLang(options.lang);
  const purityByMetal = options.purityByMetal || {};
  const spots = normalizeSpotMap(spotByMetal);

  const rows = metalKeys().map((key) => {
    const metal = getMetal(key);
    const purityCode = purityByMetal[key] || metal.defaultPurity;
    const resolved = resolveMetalGramPrice(key, purityCode, spots, { pilotEnabled });
    const grade =
      metal.purities.find((p) => p.code === resolved.purity) ||
      metal.purities.find((p) => p.code === metal.defaultPurity) ||
      metal.purities[0];

    return {
      key,
      name: lang === 'ar' ? metal.nameAr : metal.nameEn,
      symbol: metal.symbol,
      primary: Boolean(metal.primary),
      gradeCode: grade.code,
      gradeLabel: lang === 'ar' ? grade.labelAr : grade.labelEn,
      state: resolved.state, // 'ok' | 'pending-data' | 'disabled'
      usdPerGram: resolved.state === 'ok' ? resolved.usdPerGram : null,
      aedPerGram: resolved.state === 'ok' ? resolved.aedPerGram : null,
    };
  });

  return { pilotEnabled, rows, disclaimer: DISCLAIMER[lang] };
}

/** Whether the multi-metal comparison should mount (owner-gated; default OFF via the pilot flag). */
export function isMetalComparisonEnabled(opts = {}) {
  return (opts.pilotEnabled ?? METALS_PILOT_ENABLED) === true;
}

/**
 * Human-readable render of the comparison. Returns '' while the pilot is off so nothing mounts.
 * @param {ReturnType<typeof buildMetalComparison>} model
 * @param {{ lang?: 'en'|'ar' }} [options]
 * @returns {string}
 */
export function renderMetalComparison(model, options = {}) {
  const lang = pickLang(options.lang);
  if (!model || !model.pilotEnabled) return '';

  const awaiting = lang === 'ar' ? 'بانتظار البيانات' : 'awaiting data';
  const lines = model.rows.map((r) => {
    if (r.state !== 'ok') {
      return `${r.name} (${r.gradeCode}): ${awaiting}`;
    }
    return `${r.name} (${r.gradeCode}): ${r.usdPerGram} USD/g · ${r.aedPerGram} AED/g`;
  });
  lines.push(model.disclaimer);
  return lines.join('\n');
}
