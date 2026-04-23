// src/tracker/modes.js — Tracker tab-bar registry.
//
// Single source of truth for mode / panel ordering, labels, workspace
// requirements, keyboard shortcuts, and the tab / panel DOM ids consumed by
// `ui-shell.js`. Frozen under the 20-phase tracker redesign Phase 2 (IA
// contract in docs/tracker-state.md) and Phase 7 (extraction).
//
// Two kinds of entries:
//   - kind: 'mode'  → rendered as a top-level tab. Shows a full panel, owns the
//     `mode` URL-hash value, persists via `state.mode`.
//   - kind: 'panel' → rendered as an overlay toggle in the tab bar. Shows a
//     modal overlay, owns the `panel` URL-hash value, persists via
//     `state.panel`. Independent of `mode`.
//
// Registry order === tab-bar render order === `tracker.html` markup order.
// Any divergence is caught by `tests/tracker-modes.test.js`.

import { VALID_MODES, VALID_PANELS } from './state.js';

/**
 * @typedef {'basic' | 'advanced'} Workspace
 * @typedef {Object} TrackerTabEntry
 * @property {'mode' | 'panel'} kind
 * @property {string} id                 Matches the URL-hash token and DOM ids.
 * @property {string} tabId              `<button id>` in `tracker.html`.
 * @property {string} [panelId]          `<section id>` for modes; `<div id>` for overlay panels.
 * @property {Workspace} workspace       Minimum workspace required. `advanced` modes are hidden in basic.
 * @property {{ en: string, ar: string }} label
 * @property {string} [shortcut]         Single-letter keyboard shortcut (lowercase, no modifiers).
 */

/** @type {ReadonlyArray<TrackerTabEntry>} */
export const TRACKER_TABS = Object.freeze([
  {
    kind: 'mode',
    id: 'live',
    tabId: 'tab-live',
    panelId: 'mode-live',
    workspace: 'basic',
    label: { en: '📡 Live', ar: '📡 مباشر' },
    shortcut: 'h',
  },
  {
    kind: 'mode',
    id: 'compare',
    tabId: 'tab-compare',
    panelId: 'mode-compare',
    workspace: 'basic',
    label: { en: '🌍 Compare', ar: '🌍 مقارنة' },
    shortcut: 'c',
  },
  {
    kind: 'mode',
    id: 'archive',
    tabId: 'tab-archive',
    panelId: 'mode-archive',
    workspace: 'advanced',
    label: { en: '🗂 Archive', ar: '🗂 الأرشيف' },
  },
  {
    kind: 'panel',
    id: 'alerts',
    tabId: 'tab-alerts',
    panelId: 'tp-overlay-alerts',
    workspace: 'basic',
    label: { en: '🔔 Alerts', ar: '🔔 تنبيهات' },
    shortcut: 'a',
  },
  {
    kind: 'panel',
    id: 'planner',
    tabId: 'tab-planner',
    panelId: 'tp-overlay-planner',
    workspace: 'basic',
    label: { en: '📋 Planner', ar: '📋 المخطط' },
    shortcut: 'p',
  },
  {
    kind: 'mode',
    id: 'exports',
    tabId: 'tab-exports',
    panelId: 'mode-exports',
    workspace: 'advanced',
    label: { en: '⬇ Exports', ar: '⬇ تصدير' },
  },
  {
    kind: 'mode',
    id: 'method',
    tabId: 'tab-method',
    panelId: 'mode-method',
    workspace: 'advanced',
    label: { en: '📖 Method', ar: '📖 المنهجية' },
  },
]);

/** @returns {ReadonlyArray<TrackerTabEntry>} */
export const TRACKER_MODES = Object.freeze(TRACKER_TABS.filter((t) => t.kind === 'mode'));

/** @returns {ReadonlyArray<TrackerTabEntry>} */
export const TRACKER_PANELS = Object.freeze(TRACKER_TABS.filter((t) => t.kind === 'panel'));

/**
 * Look up a tab entry by its id (the URL-hash token).
 * @param {string} id
 * @returns {TrackerTabEntry | undefined}
 */
export function getTrackerTab(id) {
  return TRACKER_TABS.find((t) => t.id === id);
}

/**
 * Return the keyboard-shortcut → entry map. Intended for `ui-shell.js` keydown
 * wiring. Keys are lowercase single characters.
 * @returns {Map<string, TrackerTabEntry>}
 */
export function getShortcutMap() {
  const map = new Map();
  for (const tab of TRACKER_TABS) {
    if (tab.shortcut) map.set(tab.shortcut, tab);
  }
  return map;
}

/**
 * Integrity invariants — called from `tests/tracker-modes.test.js`. Throws on
 * first violation so failures are loud.
 */
export function assertRegistryInvariants() {
  const ids = new Set();
  const tabIds = new Set();
  const shortcuts = new Set();

  for (const tab of TRACKER_TABS) {
    if (ids.has(tab.id)) throw new Error(`Duplicate tab id: ${tab.id}`);
    ids.add(tab.id);

    if (tabIds.has(tab.tabId)) throw new Error(`Duplicate tabId: ${tab.tabId}`);
    tabIds.add(tab.tabId);

    if (tab.shortcut) {
      if (shortcuts.has(tab.shortcut)) {
        throw new Error(`Duplicate shortcut: ${tab.shortcut} (on ${tab.id})`);
      }
      if (!/^[a-z]$/.test(tab.shortcut)) {
        throw new Error(`Invalid shortcut on ${tab.id}: ${tab.shortcut}`);
      }
      shortcuts.add(tab.shortcut);
    }

    if (!tab.label || !tab.label.en || !tab.label.ar) {
      throw new Error(`Tab ${tab.id} must ship bilingual labels (EN + AR).`);
    }

    if (tab.kind === 'mode' && !VALID_MODES.has(tab.id)) {
      throw new Error(`Mode ${tab.id} not in VALID_MODES`);
    }
    if (tab.kind === 'panel' && !VALID_PANELS.has(tab.id)) {
      throw new Error(`Panel ${tab.id} not in VALID_PANELS`);
    }
  }

  // Every hash-validated mode/panel must be represented in the registry.
  for (const mode of VALID_MODES) {
    if (!TRACKER_MODES.some((t) => t.id === mode)) {
      throw new Error(`VALID_MODES contains "${mode}" but registry does not.`);
    }
  }
  for (const panel of VALID_PANELS) {
    if (!TRACKER_PANELS.some((t) => t.id === panel)) {
      throw new Error(`VALID_PANELS contains "${panel}" but registry does not.`);
    }
  }

  return true;
}
