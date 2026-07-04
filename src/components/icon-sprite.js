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

import { markTrustedNode } from '../lib/safe-dom.js';

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
  // ── Country flags (simplified, recognisable at ~20px). These are FILLED, not
  //    monoline — the consumer renders them with the `nav-flag` class (no
  //    currentColor override). Inline SVG, so they render identically on every
  //    OS (unlike flag emoji, which fall back to "AE" letter pairs on Windows).
  [
    'f-ae',
    '<rect width="24" height="24" fill="#ffffff"/><rect x="6" width="18" height="8" fill="#009739"/><rect x="6" y="16" width="18" height="8" fill="#000000"/><rect width="6" height="24" fill="#ce1126"/>',
  ],
  [
    'f-sa',
    '<rect width="24" height="24" fill="#006c35"/><rect x="4.5" y="14.4" width="15" height="1.6" rx="0.7" fill="#ffffff"/><rect x="6" y="8.8" width="12" height="1.2" rx="0.6" fill="#ffffff"/>',
  ],
  [
    'f-kw',
    '<rect width="24" height="24" fill="#ffffff"/><rect width="24" height="8" fill="#007a3d"/><rect y="16" width="24" height="8" fill="#ce1126"/><path d="M0 0H8L4 8v8l4 8H0Z" fill="#000000"/>',
  ],
  [
    'f-qa',
    '<rect width="24" height="24" fill="#8a1538"/><path d="M0 0H7l3 3-3 3 3 3-3 3 3 3-3 3 3 3-3 3H0Z" fill="#ffffff"/>',
  ],
  [
    'f-bh',
    '<rect width="24" height="24" fill="#ce1126"/><path d="M0 0H6l4 2.4-4 2.4 4 2.4-4 2.4 4 2.4-4 2.4 4 2.4-4 2.4 4 2.4-4 2.4H0Z" fill="#ffffff"/>',
  ],
  [
    'f-eg',
    '<rect width="24" height="24" fill="#ffffff"/><rect width="24" height="8" fill="#ce1126"/><rect y="16" width="24" height="8" fill="#000000"/><path d="M12 9.4l3.2 2.6-3.2 2.6-3.2-2.6z" fill="#c09300"/>',
  ],
  [
    'f-jo',
    '<rect width="24" height="24" fill="#ffffff"/><rect width="24" height="8" fill="#000000"/><rect y="16" width="24" height="8" fill="#007a3d"/><path d="M0 0L11 12 0 24Z" fill="#ce1126"/><path d="M4.2 10.2l.62 1.78h1.86l-1.5 1.1.57 1.8-1.55-1.12-1.55 1.12.57-1.8-1.5-1.1h1.86z" fill="#ffffff"/>',
  ],
  [
    'f-ma',
    '<rect width="24" height="24" fill="#c1272d"/><path d="M12 7l1.45 4.46h4.69l-3.8 2.76 1.45 4.46L12 16.18l-3.79 2.5 1.45-4.46-3.8-2.76h4.69z" fill="none" stroke="#006233" stroke-width="1"/>',
  ],
  [
    'f-tr',
    '<rect width="24" height="24" fill="#e30a17"/><circle cx="10" cy="12" r="5.2" fill="#ffffff"/><circle cx="11.9" cy="12" r="4.1" fill="#e30a17"/><path d="M16.4 12l1.55.5-.96 1.32.01-1.64-1.56-.5 1.56-.5-.01-1.64z" fill="#ffffff"/>',
  ],
  // ── V1-VISUAL additions: UI symbols (monoline, currentColor) ──────────────
  ['i-refresh', '<path d="M19 12a7 7 0 1 1-2.05-4.95"/><path d="M19.2 3.8v3.4h-3.4"/>'],
  ['i-close', '<path d="M6 6l12 12M18 6 6 18"/>'],
  ['i-star', '<path d="M12 4.5l2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.5 5-.7Z"/>'],
  ['i-external', '<path d="M10 5H5v14h14v-5"/><path d="M14 4h6v6"/><path d="M20 4l-9 9"/>'],
  ['i-check', '<path d="M5 12.5l4.5 4.5L19 7.5"/>'],
  ['i-camera', '<path d="M4 8h3.2l1.6-2.2h6.4L16.8 8H20v11H4Z"/><circle cx="12" cy="13" r="3.2"/>'],
  ['i-clock', '<circle cx="12" cy="12" r="8"/><path d="M12 7.5V12l3 2"/>'],
  [
    'i-archive',
    '<rect x="4" y="4" width="16" height="5" rx="1"/><path d="M6 9v10h12V9"/><path d="M10 13h4"/>',
  ],
  [
    'i-wire',
    '<circle cx="12" cy="12" r="2"/><path d="M8.5 15.5a5 5 0 0 1 0-7M15.5 8.5a5 5 0 0 1 0 7"/><path d="M6 18a8.5 8.5 0 0 1 0-12M18 6a8.5 8.5 0 0 1 0 12"/>',
  ],
  ['i-list', '<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>'],
  [
    'i-phone',
    '<path d="M7 3h4l1.5 4.5-2.2 1.8a12 12 0 0 0 4.4 4.4l1.8-2.2L21 13v4a2 2 0 0 1-2 2A16 16 0 0 1 5 5a2 2 0 0 1 2-2Z"/>',
  ],
  ['i-warning', '<path d="M12 4 2.8 19.5h18.4Z"/><path d="M12 10v4.5M12 17.2h.01"/>'],
  ['i-up', '<path d="M12 19V6"/><path d="M6.5 11.5 12 6l5.5 5.5"/>'],
  ['i-down', '<path d="M12 5v13"/><path d="M6.5 12.5 12 18l5.5-5.5"/>'],
  ['i-flat', '<circle cx="12" cy="12" r="1.6"/><path d="M4.5 12h5M14.5 12h5"/>'],
  [
    'i-share',
    '<circle cx="6.5" cy="12" r="2.2"/><circle cx="17" cy="6.5" r="2.2"/><circle cx="17" cy="17.5" r="2.2"/><path d="M8.6 11 15 7.4M8.6 13 15 16.6"/>',
  ],
  [
    'i-help',
    '<circle cx="12" cy="12" r="9"/><path d="M9.4 9.4a2.6 2.6 0 1 1 3.7 2.3c-.8.4-1.1 1-1.1 1.8v.4"/><path d="M12 17h.01"/>',
  ],
  // ── V1-VISUAL additions: SVG flags for every countries.js market ──────────
  [
    'f-om',
    '<rect width="24" height="24" fill="#ffffff"/><rect y="8" width="24" height="8" fill="#db161b"/><rect y="16" width="24" height="8" fill="#008040"/><rect width="7" height="24" fill="#db161b"/>',
  ],
  [
    'f-lb',
    '<rect width="24" height="24" fill="#ffffff"/><rect width="24" height="6" fill="#ee161f"/><rect y="18" width="24" height="6" fill="#ee161f"/><path d="M12 7.5l4.2 7.3h-3v2.2h-2.4v-2.2h-3Z" fill="#00a651"/>',
  ],
  [
    'f-iq',
    '<rect width="24" height="24" fill="#ffffff"/><rect width="24" height="8" fill="#ce1126"/><rect y="16" width="24" height="8" fill="#000000"/><rect x="7" y="11" width="10" height="2" rx="1" fill="#007a3d"/>',
  ],
  [
    'f-sy',
    '<rect width="24" height="24" fill="#ffffff"/><rect width="24" height="8" fill="#007a3d"/><rect y="16" width="24" height="8" fill="#000000"/><circle cx="6" cy="12" r="1.4" fill="#ce1126"/><circle cx="12" cy="12" r="1.4" fill="#ce1126"/><circle cx="18" cy="12" r="1.4" fill="#ce1126"/>',
  ],
  [
    'f-ps',
    '<rect width="24" height="24" fill="#ffffff"/><rect width="24" height="8" fill="#000000"/><rect y="16" width="24" height="8" fill="#007a3d"/><path d="M0 0 11 12 0 24Z" fill="#ce1126"/>',
  ],
  [
    'f-ye',
    '<rect width="24" height="24" fill="#ffffff"/><rect width="24" height="8" fill="#ce1126"/><rect y="16" width="24" height="8" fill="#000000"/>',
  ],
  [
    'f-ly',
    '<rect width="24" height="24" fill="#000000"/><rect width="24" height="6" fill="#e70013"/><rect y="18" width="24" height="6" fill="#239e46"/><circle cx="11" cy="12" r="3" fill="#ffffff"/><circle cx="12.3" cy="12" r="2.4" fill="#000000"/><path d="M15.4 12l1.9.6-1.2 1.6.01-2-1.9-.6 1.9-.6-.01-2 1.2 1.6Z" fill="#ffffff"/>',
  ],
  [
    'f-tn',
    '<rect width="24" height="24" fill="#e70013"/><circle cx="12" cy="12" r="6" fill="#ffffff"/><circle cx="11.3" cy="12" r="3.6" fill="#e70013"/><circle cx="12.5" cy="12" r="2.9" fill="#ffffff"/><path d="M13 12l3.4 1.1-2.1 -2.9v3.6l2.1-2.9Z" fill="#e70013"/>',
  ],
  [
    'f-dz',
    '<rect width="24" height="24" fill="#ffffff"/><rect width="12" height="24" fill="#006233"/><circle cx="12" cy="12" r="4.2" fill="#d21034"/><circle cx="13.5" cy="12" r="3.4" fill="#ffffff"/><path d="M14.2 12l2.8.9-1.7-2.4v3l1.7-2.4Z" fill="#d21034"/>',
  ],
  [
    'f-sd',
    '<rect width="24" height="24" fill="#ffffff"/><rect width="24" height="8" fill="#d21034"/><rect y="16" width="24" height="8" fill="#000000"/><path d="M0 0 10 12 0 24Z" fill="#007229"/>',
  ],
  [
    'f-so',
    '<rect width="24" height="24" fill="#4189dd"/><path d="M12 6.5l1.7 4.1 4.4.35-3.35 2.9 1.05 4.3L12 15.8l-3.8 2.35 1.05-4.3-3.35-2.9 4.4-.35Z" fill="#ffffff"/>',
  ],
  [
    'f-mr',
    '<rect width="24" height="24" fill="#006233"/><rect width="24" height="3.5" fill="#cd2a3e"/><rect y="20.5" width="24" height="3.5" fill="#cd2a3e"/><circle cx="12" cy="10.8" r="4.5" fill="#ffc400"/><circle cx="12" cy="9" r="4.1" fill="#006233"/><path d="M12 12.6l.7 1.8h1.9l-1.5 1.2.55 1.8-1.65-1.1-1.65 1.1.55-1.8-1.5-1.2h1.9Z" fill="#ffc400"/>',
  ],
  [
    'f-dj',
    '<rect width="24" height="24" fill="#6ab2e7"/><rect y="12" width="24" height="12" fill="#12ad2b"/><path d="M0 0 12 12 0 24Z" fill="#ffffff"/><path d="M4.2 9.6l.6 1.85h1.95L5.2 12.6l.6 1.85-1.6-1.15-1.6 1.15.6-1.85-1.55-1.15h1.95Z" fill="#d7141a"/>',
  ],
  [
    'f-km',
    '<rect width="24" height="6" fill="#ffc61e"/><rect y="6" width="24" height="6" fill="#ffffff"/><rect y="12" width="24" height="6" fill="#ce1126"/><rect y="18" width="24" height="6" fill="#3a75c4"/><path d="M0 0 12 12 0 24Z" fill="#3d8e33"/><circle cx="5" cy="12" r="3" fill="#ffffff"/><circle cx="6.2" cy="12" r="2.5" fill="#3d8e33"/>',
  ],
  [
    'f-pk',
    '<rect width="24" height="24" fill="#01411c"/><rect width="6" height="24" fill="#ffffff"/><circle cx="14.5" cy="12" r="4.5" fill="#ffffff"/><circle cx="15.9" cy="10.9" r="3.9" fill="#01411c"/><path d="M17.4 8.6l.5 1.55h1.6l-1.3.95.5 1.55-1.3-.95-1.3.95.5-1.55-1.3-.95h1.6Z" fill="#ffffff"/>',
  ],
  [
    'f-us',
    '<rect width="24" height="24" fill="#ffffff"/><path d="M0 0h24v3.4H0Zm0 6.9h24v3.4H0Zm0 6.8h24v3.4H0Zm0 6.9h24v3.4H0Z" fill="#b22234"/><rect width="10" height="10.3" fill="#3c3b6e"/>',
  ],
  [
    'f-gb',
    '<rect width="24" height="24" fill="#012169"/><path d="M0 0l24 24M24 0 0 24" stroke="#ffffff" stroke-width="4"/><path d="M12 0v24M0 12h24" stroke="#ffffff" stroke-width="7"/><path d="M12 0v24M0 12h24" stroke="#c8102e" stroke-width="4"/>',
  ],
  [
    'f-eu',
    '<rect width="24" height="24" fill="#003399"/><circle cx="12" cy="6.5" r="1.1" fill="#ffcc00"/><circle cx="16.9" cy="8.6" r="1.1" fill="#ffcc00"/><circle cx="17.5" cy="13.8" r="1.1" fill="#ffcc00"/><circle cx="14" cy="17.5" r="1.1" fill="#ffcc00"/><circle cx="10" cy="17.5" r="1.1" fill="#ffcc00"/><circle cx="6.5" cy="13.8" r="1.1" fill="#ffcc00"/><circle cx="7.1" cy="8.6" r="1.1" fill="#ffcc00"/>',
  ],
  [
    'f-in',
    '<rect width="24" height="24" fill="#ffffff"/><rect width="24" height="8" fill="#ff9933"/><rect y="16" width="24" height="8" fill="#138808"/><circle cx="12" cy="12" r="2.6" fill="none" stroke="#000080" stroke-width="1"/><circle cx="12" cy="12" r="0.7" fill="#000080"/>',
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
  // Places — country/city items use real inline-SVG flags (Dubai→UAE,
  // Cairo→Egypt); all-countries stays a globe, the GCC region stays a map.
  GLB: 'i-globe',
  GCC: 'i-map',
  AE: 'f-ae',
  DXB: 'f-ae',
  CAI: 'f-eg',
  SA: 'f-sa',
  KW: 'f-kw',
  QA: 'f-qa',
  BH: 'f-bh',
  EG: 'f-eg',
  JO: 'f-jo',
  MA: 'f-ma',
  TR: 'f-tr',
  UAE: 'f-ae',
  OM: 'f-om',
  LB: 'f-lb',
  IQ: 'f-iq',
  SY: 'f-sy',
  PS: 'f-ps',
  YE: 'f-ye',
  LY: 'f-ly',
  TN: 'f-tn',
  DZ: 'f-dz',
  SD: 'f-sd',
  SO: 'f-so',
  MR: 'f-mr',
  DJ: 'f-dj',
  KM: 'f-km',
  PK: 'f-pk',
  US: 'f-us',
  GB: 'f-gb',
  EU: 'f-eu',
  IN: 'f-in',
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

/**
 * Resolve an ISO country code (as used in src/config/countries.js) to its flag
 * symbol id, or null when no flag symbol exists. Callers should fall back to
 * text-only rendering — never to flag emoji (Windows renders those as "AE"
 * letter pairs).
 * @param {string} code  e.g. 'AE', 'OM'
 * @returns {string | null}
 */
export function flagSymbolForCountry(code) {
  const id = `f-${String(code || '').toLowerCase()}`;
  return ICON_SYMBOL_IDS.has(id) ? id : null;
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
  const isFlag = id.startsWith('f-');
  const className = iconClass(id, opts.className || (isFlag ? 'nav-flag' : 'nav-ico'));
  // Flags are multi-colour fills; monoline icons inherit currentColor as stroke.
  const paint = isFlag ? '' : ' fill="none" stroke="currentColor"';
  return `<svg class="${className}" viewBox="0 0 24 24"${paint} aria-hidden="true" focusable="false"><use href="#${id}"/></svg>`;
}

/**
 * DOM-element variant for `createElement`-based render paths (e.g. search
 * results). Uses `createElementNS` only — zero innerHTML sinks.
 * @param {string} symbol  symbol id, e.g. 'i-globe'
 * @param {string} [className]
 * @returns {SVGSVGElement}
 */
export function iconUseElement(symbol, className) {
  const NS = 'http://www.w3.org/2000/svg';
  const XLINK = 'http://www.w3.org/1999/xlink';
  const id = safeSymbolId(symbol);
  const isFlag = id.startsWith('f-');
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', iconClass(id, className || (isFlag ? 'nav-flag' : 'nav-ico')));
  svg.setAttribute('viewBox', '0 0 24 24');
  if (!isFlag) {
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
  }
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const use = document.createElementNS(NS, 'use');
  const ref = '#' + safeSymbolId(symbol);
  use.setAttribute('href', ref);
  // Legacy attribute for older engines that ignore plain `href` on <use>.
  // Guarded: bare-bones DOM shims in tests implement setAttribute only.
  if (typeof use.setAttributeNS === 'function') use.setAttributeNS(XLINK, 'xlink:href', ref);
  svg.append(use);
  // Branded so safe-dom's el() accepts the icon as a nested child — this
  // module builds nodes exclusively from createElementNS + sanitized ids.
  return markTrustedNode(svg);
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
