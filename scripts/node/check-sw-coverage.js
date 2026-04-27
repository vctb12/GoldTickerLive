#!/usr/bin/env node
/**
 * W-14 — Service-worker coverage audit.
 *
 * Asserts that every top-level entry HTML page either registers the service
 * worker (`navigator.serviceWorker.register('sw.js' | '/sw.js')`) directly,
 * loads a JS module that registers it (e.g. `src/pages/home.js`), or is on
 * the documented allow-list of pages that intentionally skip SW registration.
 *
 * The allow-list is a baseline, not a permanent waiver: each entry has a
 * one-line rationale. Adding a new entry HTML at repo root that lacks SW
 * registration and isn't on the allow-list will fail this check — the fix
 * is either to register the SW from the page, or to extend the allow-list
 * with a justification.
 *
 * Companion report: `reports/sw-coverage.md`.
 *
 * Usage:
 *   node scripts/node/check-sw-coverage.js
 *
 * Exit code 0 = pass. Exit code 1 = a tracked entry HTML page doesn't
 * register the SW and isn't on the allow-list.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');

// Entry HTML pages we audit (top-level repo root only — leaf country/city
// pages are hydrated by `src/lib/page-hydrator.js`, which is itself loaded
// only after first-paint and isn't responsible for SW registration today;
// SW registration on those routes is tracked separately in §22b).
const ENTRY_GLOB = (dir) =>
  fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isFile() && d.name.endsWith('.html'))
    .map((d) => d.name);

// Pages that intentionally do **not** register the service worker today.
// Each entry must carry a rationale; without one the audit reads as
// "we forgot to register SW here".
const ALLOW_LIST = {
  '404.html': 'Error page; SW would self-cache before render. No need.',
  'offline.html': 'Served *by* the SW when network is down — must not register itself.',
  'privacy.html': 'Static legal page, low value to cache. Tracked in §22b for follow-up.',
  'terms.html': 'Static legal page, low value to cache. Tracked in §22b for follow-up.',
  'pricing.html': 'Subscription page; SW caching could mask price changes. Intentionally skipped.',

  // ────────────────────────────────────────────────────────────────────
  // Pre-existing baseline (before W-14 audit). These entry pages should
  // ideally register the SW for offline support but currently do not.
  // Tracked as follow-up in `reports/sw-coverage.md`. Removing an entry
  // here without registering the SW will fail this check — the right
  // fix is to add the registration snippet.
  // ────────────────────────────────────────────────────────────────────
  'calculator.html': 'TODO §22b — registration not yet wired; safe to add.',
  'insights.html': 'TODO §22b — registration not yet wired; safe to add.',
  'learn.html': 'TODO §22b — registration not yet wired; safe to add.',
  'methodology.html': 'TODO §22b — registration not yet wired; safe to add.',
  'shops.html': 'TODO §22b — registration not yet wired; safe to add.',
  'tracker.html': 'TODO §22b — registration not yet wired; safe to add.',
};

// Modules that, when loaded as a `<script src=…>`, register the SW.
// Anchored to the path string so a link re-arrangement still matches.
const SW_LOADER_SIGNATURES = ['src/pages/home.js'];

function readPage(file) {
  return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

function pageRegistersSw(html) {
  // Inline registration — match either a literal `'sw.js'` / `'/sw.js'` after
  // `serviceWorker.register`, or any `navigator.serviceWorker.register(`.
  if (/navigator\.serviceWorker\.register\s*\(/.test(html)) return true;
  // Loaded module registers it.
  for (const sig of SW_LOADER_SIGNATURES) {
    if (html.includes(sig)) return true;
  }
  return false;
}

const failures = [];
const registered = [];
const allowed = [];

for (const file of ENTRY_GLOB(ROOT).sort()) {
  const html = readPage(file);
  if (pageRegistersSw(html)) {
    registered.push(file);
    if (Object.prototype.hasOwnProperty.call(ALLOW_LIST, file)) {
      // Entry was on the allow-list but now actually registers — tighten the
      // baseline by removing it from the allow-list.
      console.warn(
        `[sw-coverage] ${file} now registers the SW. Remove it from ALLOW_LIST in scripts/node/check-sw-coverage.js to tighten the baseline.`
      );
    }
    continue;
  }
  if (Object.prototype.hasOwnProperty.call(ALLOW_LIST, file)) {
    allowed.push(file);
    continue;
  }
  failures.push(file);
}

if (failures.length > 0) {
  console.error('[sw-coverage] FAIL — entry pages without SW registration:');
  for (const f of failures) console.error(`  - ${f}`);
  console.error(
    '\nFix: register the SW from the page (see invest.html for the canonical snippet)\n' +
      'or extend ALLOW_LIST in scripts/node/check-sw-coverage.js with a one-line rationale.\n'
  );
  process.exit(1);
}

console.log(
  `[sw-coverage] OK — ${registered.length} registered, ${allowed.length} allow-listed, 0 unregistered.`
);
