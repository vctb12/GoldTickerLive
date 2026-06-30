/**
 * components/icon-sprite.js — Single source of truth for the site's monoline
 * vector icon set.
 *
 * Background: PR #464 shipped a hidden inline `<svg><symbol>` sprite, but only
 * on the homepage (`index.html`). The shared nav renders on all ~390 pages and
 * still used text-string "icons" (e.g. `CAI`, `LIVE`, `22K`) and emoji. This
 * module promotes that sprite to a shared asset so every page can consume the
 * icons via `<use href="#i-…">` at ~zero network cost (inline, no extra request).
 *
 * Design contract (mirrors the #464 trust rules):
 *   • Monoline, 24×24 viewBox, `stroke="currentColor"`, `fill="none"`.
 *   • Decorative only — every consuming element keeps `aria-hidden="true"` and
 *     a real adjacent text label, so screen-reader output is unchanged.
 *   • No numerals, candlesticks, arrows-as-price, or price stamps (§ trust rules).
 *   • No unsafe DOM sinks: string helpers feed existing safe templates; the DOM
 *     helper uses `createElementNS` only. This file must stay at 0 innerHTML
 *     sinks (see scripts/node/check-unsafe-dom.js).
 *
 * The homepage keeps an inline copy of this sprite (FOUC-free for its static
 * `<use>` markup). `scripts/node/sync-icon-sprite.js --check` guarantees that
 * inline copy stays byte-identical to `ICON_SPRITE_MARKUP` below.
 */

export const ICON_SPRITE_ID = 'gtl-icon-sprite';

/**
 * The canonical symbol definitions. Order is stable so the synced inline copy in
 * index.html stays deterministic. Keep paths monoline and optically consistent.
 */
const SYMBOLS = [
  ['i-chart', '<path d="M4 5v14h15"/><path d="M7 14l3.5-4 3 2.5L19 7"/>'],
  [
    'i-calc',
    '<rect x="6" y="3" width="12" height="18" rx="2"/><line x1="9" y1="7" x2="15" y2="7"/><line x1="9" y1="11" x2="9.01" y2="11"/><line x1="12" y1="11" x2="12.01" y2="11"/><line x1="15" y1="11" x2="15.01" y2="11"/><line x1="9" y1="14" x2="9.01" y2="14"/><line x1="12" y1="14" x2="12.01" y2="14"/><line x1="15" y1="14" x2="15.01" y2="14"/><line x1="9" y1="17.5" x2="12" y2="17.5"/>',
  ],
  [
    'i-pin',
    '<path d="M12 21s6-5.3 6-10A6 6 0 0 0 6 11c0 4.7 6 10 6 10Z"/><circle cx="12" cy="11" r="2.2"/>',
  ],
  [
    'i-shop',
    '<path d="M4.5 10l1.3-5h12.4l1.3 5"/><path d="M4.5 10a2 2 0 0 0 3.75 0 2 2 0 0 0 3.75 0 2 2 0 0 0 3.75 0 2 2 0 0 0 3.75 0"/><path d="M6 11.5V20h12v-8.5"/><path d="M10 20v-4.5h4V20"/>',
  ],
  ['i-map', '<path d="M9 4 4 6v14l5-2 6 2 5-2V4l-5 2-6-2Z"/><path d="M9 4v14M15 6v14"/>'],
  [
    'i-book',
    '<path d="M12 6c-1.8-1.2-4-1.5-6-1.5V18c2 0 4.2.3 6 1.5 1.8-1.2 4-1.5 6-1.5V4.5c-2 0-4.2.3-6 1.5Z"/><path d="M12 6v13.5"/>',
  ],
  [
    'i-bars',
    '<path d="M4 20h16"/><rect x="6" y="11" width="3" height="6"/><rect x="10.5" y="7" width="3" height="10"/><rect x="15" y="13" width="3" height="4"/>',
  ],
  [
    'i-beaker',
    '<path d="M9 3h6M10 3v6.2L5.6 17a2 2 0 0 0 1.8 3h9.2a2 2 0 0 0 1.8-3L14 9.2V3"/><path d="M8 14.5h8"/>',
  ],
  [
    'i-coins',
    '<ellipse cx="12" cy="7" rx="6" ry="2.6"/><path d="M6 7v5c0 1.4 2.7 2.6 6 2.6s6-1.2 6-2.6V7"/><path d="M6 12v5c0 1.4 2.7 2.6 6 2.6s6-1.2 6-2.6v-5"/>',
  ],
  [
    'i-skyline',
    '<path d="M3 21h18"/><path d="M6.5 21V11l3-2v12"/><path d="M9.5 21V6l4 2.2V21"/><path d="M13.5 21V12l4 2.2V21"/><path d="M11.5 3v3"/>',
  ],
  [
    'i-globe',
    '<circle cx="12" cy="12" r="8"/><path d="M4 12h16"/><path d="M12 4c2.8 2.2 2.8 13.8 0 16M12 4c-2.8 2.2-2.8 13.8 0 16"/>',
  ],
  [
    'i-receipt',
    '<path d="M6 3h12v18l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3L6 21Z"/><path d="M9 8h6M9 12h6M9 15.5h4"/>',
  ],
  ['i-bolt', '<path d="M13 3 5 13h5l-1 8 8-10h-5l1-8Z"/>'],
  [
    'i-scale',
    '<path d="M12 4v16M7 20h10M5 7h14M5 7l-2.6 5.5h5.2L5 7ZM19 7l-2.6 5.5h5.2L19 7Z"/><path d="M2.4 12.5a2.6 2.6 0 0 0 5.2 0M16.4 12.5a2.6 2.6 0 0 0 5.2 0"/>',
  ],
  [
    'i-lock',
    '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  ],
  ['i-lang', '<path d="M4 5h16v10H9l-4 4v-4H4Z"/><path d="M8 9h8M8 12h5"/>'],
  [
    'i-offline',
    '<path d="M5 12.5a10 10 0 0 1 4-2.4M19 12.5a9.5 9.5 0 0 0-3-2M8.5 15.6a5 5 0 0 1 7 0M12 19h.01"/><path d="M3 3l18 18"/>',
  ],
  ['i-info', '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'],
  ['i-exchange', '<path d="M4 9h14l-3.2-3.2M20 15H6l3.2 3.2"/>'],
  // ── Added for the site-wide nav/chrome icon system (this PR) ──────────────
  ['i-search', '<circle cx="11" cy="11" r="6.5"/><path d="M16.5 16.5 20 20"/>'],
  ['i-menu', '<path d="M4 7h16M4 12h16M4 17h16"/>'],
  [
    'i-bell',
    '<path d="M6.5 16V11a5.5 5.5 0 0 1 11 0v5l1.5 2H5l1.5-2Z"/><path d="M9.8 19a2.4 2.4 0 0 0 4.4 0"/>',
  ],
  ['i-download', '<path d="M12 4v10"/><path d="M8 11l4 4 4-4"/><path d="M5 19.5h14"/>'],
  ['i-code', '<path d="M8.5 8 4.5 12l4 4"/><path d="M15.5 8l4 4-4 4"/>'],
  [
    'i-sun',
    '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.5M12 19v2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M2.5 12H5M19 12h2.5M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8"/>',
  ],
  ['i-moon', '<path d="M20 13.5A7.5 7.5 0 0 1 10.5 4 7.5 7.5 0 1 0 20 13.5Z"/>'],
  [
    'i-theme-auto',
    '<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16Z" fill="currentColor" stroke="none"/>',
  ],
];

/** Set of valid symbol ids — used to sanitise any id before it reaches markup. */
export const ICON_SYMBOL_IDS = new Set(SYMBOLS.map(([id]) => id));

/**
 * The full hidden sprite markup. Attributes match the homepage's #464 inline
 * sprite (`width="0" height="0" class="ti-sprite"`) so the synced inline copy is
 * byte-identical, plus the de-dupe id.
 */
export const ICON_SPRITE_MARKUP =
  `<svg id="${ICON_SPRITE_ID}" width="0" height="0" class="ti-sprite" aria-hidden="true" focusable="false" style="position: absolute">` +
  '<defs>' +
  SYMBOLS.map(([id, body]) => `<symbol id="${id}" viewBox="0 0 24 24">${body}</symbol>`).join('') +
  '</defs></svg>';

/**
 * Semantic nav-data `icon:` keys → symbol ids. Keys stay human-readable in
 * nav-data.js (places, tools, karats); this is the only place they bind to art.
 * Country/city items use `i-pin` (a location marker) rather than flag emoji:
 * flag emoji fall back to ISO letter pairs ("AE") on Windows — i.e. they would
 * re-introduce the exact text-"logo" bug this work removes.
 */
export const NAV_ICONS = {
  // Live / prices
  LIVE: 'i-bolt',
  CMP: 'i-scale',
  RATE: 'i-scale',
  HIST: 'i-chart',
  SPOT: 'i-exchange',
  // Places
  GLB: 'i-globe',
  GCC: 'i-map',
  AE: 'i-pin',
  DXB: 'i-pin',
  CAI: 'i-pin',
  SA: 'i-pin',
  KW: 'i-pin',
  QA: 'i-pin',
  BH: 'i-pin',
  EG: 'i-pin',
  JO: 'i-pin',
  MA: 'i-pin',
  TR: 'i-pin',
  UAE: 'i-pin',
  // Karat guides (product categories, never prices → a coin glyph, not a numeral)
  '22K': 'i-coins',
  '24K': 'i-coins',
  // Tools
  CALC: 'i-calc',
  ZKT: 'i-receipt',
  ROI: 'i-chart',
  INV: 'i-coins',
  SCP: 'i-beaker',
  WGT: 'i-scale',
  MTH: 'i-book',
  SRCH: 'i-search',
  ALRT: 'i-bell',
  CSV: 'i-download',
  EMBD: 'i-code',
  // Discover
  SHOP: 'i-shop',
  SOUK: 'i-shop',
  KHAN: 'i-shop',
  BUY: 'i-receipt',
  FEE: 'i-receipt',
  VIEW: 'i-chart',
};

/** Resolve a nav-data icon key (or a raw symbol id) to a valid symbol id. */
export function navIconSymbol(key) {
  if (!key) return null;
  if (ICON_SYMBOL_IDS.has(key)) return key; // already a symbol id
  return NAV_ICONS[key] || 'i-pin';
}

/** Keep only characters valid in our symbol ids — defence in depth before markup. */
function safeSymbolId(symbol) {
  return String(symbol).replace(/[^a-z0-9-]/gi, '');
}

/**
 * Symbols that encode a reading-direction (left↔right arrows). These get an
 * extra class so CSS can mirror them under `[dir="rtl"]`.
 */
const DIRECTIONAL = new Set(['i-exchange']);

/** Build the class list for a rendered icon, adding the RTL-mirror hook. */
function iconClass(id, base) {
  const className = base || 'nav-ico';
  return DIRECTIONAL.has(id) ? `${className} nav-ico--dir` : className;
}

/**
 * Build an `<svg><use></svg>` HTML string for inclusion in an already-trusted
 * template (the sprite ids are sanitised; no user data is interpolated).
 * @param {string} symbol  symbol id, e.g. 'i-bolt'
 * @param {{className?:string}} [opts]
 */
export function iconSvg(symbol, opts = {}) {
  const id = safeSymbolId(symbol);
  if (!id) return '';
  const className = iconClass(id, opts.className);
  return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true" focusable="false"><use href="#${id}"/></svg>`;
}

/**
 * DOM-element variant for `createElement`-based render paths (e.g. search
 * results). Uses `createElementNS` only — zero innerHTML sinks.
 * @param {string} symbol  symbol id, e.g. 'i-globe'
 * @param {string} [className]
 * @returns {SVGSVGElement}
 */
export function iconUseElement(symbol, className = 'nav-ico') {
  const NS = 'http://www.w3.org/2000/svg';
  const XLINK = 'http://www.w3.org/1999/xlink';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', iconClass(safeSymbolId(symbol), className));
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const use = document.createElementNS(NS, 'use');
  const ref = '#' + safeSymbolId(symbol);
  use.setAttribute('href', ref);
  // Legacy attribute for older engines that ignore plain `href` on <use>.
  use.setAttributeNS(XLINK, 'xlink:href', ref);
  svg.appendChild(use);
  return svg;
}

/**
 * Returns the sprite markup to prepend to a page once, or '' if it (or the
 * homepage's inline copy) is already present. The caller injects it through its
 * own existing safe template — this helper adds no DOM sink itself.
 * @param {Document} [doc]
 */
export function spriteMarkupIfAbsent(doc = document) {
  return doc.getElementById(ICON_SPRITE_ID) ? '' : ICON_SPRITE_MARKUP;
}
