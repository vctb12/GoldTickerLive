/**
 * tracker/formatting.js - Extract formatting helpers from render.js
 * Reduces complexity by separating pure formatting functions
 */

export function formatUsd(value, decimals = 2) {
  if (!Number.isFinite(value)) return '—';
  return `$${value.toLocaleString('en', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export function formatUnitLabel(unit, lang) {
  if (lang !== 'ar') return unit;
  if (unit === 'gram') return 'غرام';
  if (unit === 'oz') return 'أوقية';
  return unit;
}

export const TRACKER_BADGE_CLASSES = [
  'tracker-badge-live',
  'tracker-badge--cached',
  'tracker-badge--stale',
  'tracker-badge--unavailable',
];

export const SOURCE_BADGE_CLASS = {
  live: 'tracker-source-badge--live',
  cached: 'tracker-source-badge--cached',
  stale: 'tracker-source-badge--estimated',
  unavailable: 'tracker-source-badge--unavailable',
};

export const STATUS_BADGE_CLASS = {
  live: 'tracker-badge-live',
  cached: 'tracker-badge--cached',
  stale: 'tracker-badge--stale',
  unavailable: 'tracker-badge--unavailable',
};

export function applyStatusBadge(node, freshness, text) {
  if (!node) return;
  node.classList.remove(...TRACKER_BADGE_CLASSES);
  node.classList.add(freshness.badgeClass);
  node.title = freshness.tooltip;
  node.setAttribute('aria-label', freshness.tooltip);
  if (typeof text === 'string') {
    node.textContent = '';
    node.appendChild(document.createTextNode(text));
  }
}
