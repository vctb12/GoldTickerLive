/**
 * components/nav/dropdown-builders.js - Dropdown HTML builders
 * Extracts HTML generation logic from nav.js for better modularity
 */

import { resolveHref, isPageMatch, escapeHtml } from './helpers.js';

export function buildDropdownItem(item, depth) {
  const href = resolveHref(item.href, depth);
  const isActive = isPageMatch(href);
  const classes = ['nav-dropdown-item'];
  if (isActive) classes.push('nav-dropdown-item--active');
  if (item.primary) classes.push('nav-dropdown-item--primary');

  const ariaCurrent = isActive ? ' aria-current="page"' : '';
  const iconHtml = item.icon
    ? `<span class="nav-dropdown-item-icon" aria-hidden="true">${escapeHtml(item.icon)}</span>`
    : '';
  const descHtml = item.description
    ? `<span class="nav-dropdown-item-desc">${escapeHtml(item.description)}</span>`
    : '';

  return `<a href="${href}" class="${classes.join(' ')}"${ariaCurrent} role="menuitem">
    ${iconHtml}
    <span class="nav-dropdown-item-body">
      <span class="nav-dropdown-item-label">${escapeHtml(item.label)}</span>
      ${descHtml}
    </span>
  </a>`;
}

export function buildDropdownPanel(group, depth) {
  const itemsHtml = group.items.map((item) => buildDropdownItem(item, depth)).join('');
  const layout = group.layout === 'two-col' ? 'two-col' : 'one-col';

  const headerHtml = group.description
    ? `<div class="nav-dropdown-panel-header">
         <span class="nav-dropdown-panel-title">${escapeHtml(group.label)}</span>
         <span class="nav-dropdown-panel-desc">${escapeHtml(group.description)}</span>
       </div>`
    : '';

  return `<div class="nav-dropdown-panel" role="menu" aria-label="${escapeHtml(group.label)}" data-layout="${layout}">
    ${headerHtml}
    <div class="nav-dropdown-panel-items" data-layout="${layout}">
      ${itemsHtml}
    </div>
  </div>`;
}

export function buildDrawerLink(item, depth) {
  const href = resolveHref(item.href, depth);
  const isActive = isPageMatch(href);
  const classes = ['nav-drawer-link'];
  if (isActive) classes.push('nav-link--active');
  if (item.primary) classes.push('nav-drawer-link--primary');

  const ariaCurrent = isActive ? ' aria-current="page"' : '';
  const iconHtml = item.icon
    ? `<span class="nav-drawer-link-icon" aria-hidden="true">${escapeHtml(item.icon)}</span>`
    : '';

  return `<a href="${href}" class="${classes.join(' ')}"${ariaCurrent}>
    ${iconHtml}<span class="nav-drawer-link-label">${escapeHtml(item.label)}</span>
  </a>`;
}

export function buildDrawerGroup(group, depth) {
  const itemsHtml = group.items.map((item) => buildDrawerLink(item, depth)).join('');

  return `<details class="nav-drawer-group" open>
    <summary class="nav-drawer-group-label">
      <span>${escapeHtml(group.label)}</span>
      <span class="nav-drawer-group-caret" aria-hidden="true"></span>
    </summary>
    <div class="nav-drawer-group-items">
      ${itemsHtml}
    </div>
  </details>`;
}
