/**
 * Reusable skeleton placeholders for price surfaces (cards, tables, freshness chips).
 * Uses safe DOM only — shimmer via `.skeleton-inline` + size utilities in shell/skeleton CSS.
 */

import { el } from '../lib/safe-dom.js';

/** @typedef {'priceLg'|'priceMd'|'karat'|'freshnessChip'|'freshnessStrip'|'tableCell'|'block'} SkeletonVariant */

const VARIANT_CLASS = {
  priceLg: 'shell-skeleton-price-lg',
  priceMd: 'shell-skeleton-price-md',
  karat: 'shell-skeleton-karat',
  freshnessChip: 'shell-skeleton-freshness-chip',
  freshnessStrip: 'shell-skeleton-freshness-strip',
  tableCell: 'shell-skeleton-table-cell',
  block: 'shell-skeleton-block',
};

/**
 * @param {SkeletonVariant|string} variant
 * @param {{ className?: string, block?: boolean }} [opts]
 */
export function skeletonNode(variant = 'karat', opts = {}) {
  const sizeClass = VARIANT_CLASS[variant] || variant;
  const classes = ['skeleton-inline', sizeClass, opts.className].filter(Boolean).join(' ');
  if (opts.block) {
    return el('div', { class: classes, role: 'presentation', 'aria-hidden': 'true' });
  }
  return el('span', { class: classes, role: 'presentation', 'aria-hidden': 'true' });
}

/**
 * Replace target content with a skeleton and mark busy for assistive tech.
 * @param {HTMLElement|null} target
 * @param {SkeletonVariant|string} [variant='karat']
 */
export function mountSkeleton(target, variant = 'karat') {
  if (!target) return;
  target.replaceChildren(skeletonNode(variant));
  target.setAttribute('aria-busy', 'true');
}

/**
 * Clear a node's loading placeholder once real content arrives: drops
 * `aria-busy` plus any self-applied skeleton classes (`skeleton-inline` and the
 * `shell-skeleton-*` size utilities). Without this, elements that carry the
 * skeleton classes on themselves (vs. an inner placeholder span) keep the
 * shimmer behind the value and stay pinned to the skeleton's fixed size.
 * Other classes (layout/state) are preserved. Idempotent.
 * @param {HTMLElement|null} target
 */
export function clearSkeleton(target) {
  if (!target) return;
  if (typeof target.removeAttribute === 'function') target.removeAttribute('aria-busy');
  if (!target.classList) return;
  for (const cls of Array.from(target.classList)) {
    if (cls === 'skeleton-inline' || cls.startsWith('shell-skeleton-')) {
      target.classList.remove(cls);
    }
  }
}

/**
 * @param {HTMLElement|null} target
 */
export function hasSkeleton(target) {
  return Boolean(target?.querySelector?.('.skeleton-inline'));
}

/**
 * Build a row of table-cell skeletons (for karat tables while loading).
 * @param {number} cols
 */
export function skeletonTableRow(cols = 3) {
  const cells = [];
  for (let i = 0; i < cols; i++) {
    cells.push(el('td', null, [skeletonNode('tableCell')]));
  }
  return el('tr', { class: 'skeleton-table-row', 'aria-hidden': 'true' }, cells);
}
