/**
 * lib/metal-comparison-render.js — accessible HTML render for the multi-metal comparison (Phase 60).
 *
 * Turns the Phase 56 comparison model (+ optional Phase 58 per-metal freshness) into a bilingual,
 * accessible table. Every interpolated value is HTML-escaped via `safe-dom`'s `escape`, so the output
 * is a fully-escaped trusted fragment (no raw model text reaches the DOM). Takes the plain model
 * object as input — it does not import the model builders — so it renders whatever honest states the
 * model carries: `ok` rows show the price, `pending-data` / `disabled` rows show "awaiting data",
 * never a fabricated number.
 *
 * Pure and side-effect-free. Returns `''` when the pilot is off (nothing mounts). Prices nothing —
 * peg / troy-oz / framing untouched.
 */

import { escape } from './safe-dom.js';

const LABELS = {
  en: {
    caption: 'Precious metals — reference price per gram',
    metal: 'Metal',
    grade: 'Grade',
    perGram: 'Per gram',
    freshness: 'Freshness',
    awaiting: 'Awaiting data',
  },
  ar: {
    caption: 'المعادن الثمينة — السعر المرجعي لكل جرام',
    metal: 'المعدن',
    grade: 'العيار',
    perGram: 'لكل جرام',
    freshness: 'الحداثة',
    awaiting: 'بانتظار البيانات',
  },
};

function pickLang(lang) {
  return lang === 'ar' ? 'ar' : 'en';
}

function priceCell(row, labels) {
  if (row.state === 'ok' && row.usdPerGram != null && row.aedPerGram != null) {
    return `${escape(String(row.usdPerGram))} USD · ${escape(String(row.aedPerGram))} AED`;
  }
  return `<span class="metal-comparison__pending">${escape(labels.awaiting)}</span>`;
}

function freshnessCell(row, freshnessByMetal) {
  const fresh = freshnessByMetal[row.key] && freshnessByMetal[row.key].state;
  if (row.state !== 'ok' || !fresh) return '—';
  return `<span class="metal-badge metal-badge--${escape(fresh)}">${escape(fresh)}</span>`;
}

/**
 * Render the comparison table.
 *
 * @param {{ pilotEnabled?: boolean, rows?: object[], disclaimer?: string }} model  Phase 56 model.
 * @param {{ lang?: 'en'|'ar', freshnessByMetal?: Record<string,{state:string}> }} [options]
 * @returns {string} escaped HTML, or '' when the pilot is off.
 */
export function renderMetalComparisonTableHtml(model, options = {}) {
  const lang = pickLang(options.lang);
  const freshnessByMetal = options.freshnessByMetal || {};
  if (!model || model.pilotEnabled !== true || !Array.isArray(model.rows) || !model.rows.length) {
    return '';
  }
  const L = LABELS[lang];

  const body = model.rows
    .map(
      (row) =>
        `<tr data-metal="${escape(row.key)}" data-state="${escape(row.state)}">` +
        `<th scope="row">${escape(row.name)}</th>` +
        `<td>${escape(row.gradeLabel || row.gradeCode)}</td>` +
        `<td>${priceCell(row, L)}</td>` +
        `<td>${freshnessCell(row, freshnessByMetal)}</td>` +
        '</tr>'
    )
    .join('');

  const disclaimer = model.disclaimer
    ? `<tfoot><tr><td colspan="4" class="metal-comparison__disclaimer">${escape(model.disclaimer)}</td></tr></tfoot>`
    : '';

  return (
    `<table class="metal-comparison" lang="${lang}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">` +
    `<caption>${escape(L.caption)}</caption>` +
    '<thead><tr>' +
    `<th scope="col">${escape(L.metal)}</th>` +
    `<th scope="col">${escape(L.grade)}</th>` +
    `<th scope="col">${escape(L.perGram)}</th>` +
    `<th scope="col">${escape(L.freshness)}</th>` +
    '</tr></thead>' +
    `<tbody>${body}</tbody>` +
    disclaimer +
    '</table>'
  );
}
