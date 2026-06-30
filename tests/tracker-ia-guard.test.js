'use strict';

// Phase 5 — Tracker IA guard tests.
// Locks structural contracts that later revamp phases must not break:
//   1. Every aria-labelledby reference in tracker.html points to an existing id.
//   2. The freshness badge CSS class map covers all live-status keys.
//   3. The BADGE_CLASSES set is consistent with the STATUS_BADGE_CLASS map values.
//   4. Source badge class map covers all live-status keys.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

const ROOT = path.resolve(__dirname, '..');
const HTML = fs.readFileSync(path.join(ROOT, 'tracker.html'), 'utf8');

// Extract all ids from tracker.html
function extractIds(html) {
  const ids = new Set();
  const pattern = /\bid="([^"]+)"/g;
  let m;
  while ((m = pattern.exec(html))) ids.add(m[1]);
  return ids;
}

// Extract all aria-labelledby values from tracker.html
function extractAriaLabelledBy(html) {
  const refs = [];
  const pattern = /\baria-labelledby="([^"]+)"/g;
  let m;
  while ((m = pattern.exec(html))) {
    for (const id of m[1].split(/\s+/)) {
      if (id) refs.push(id);
    }
  }
  return refs;
}

// The 6 canonical live-status keys (from live-status.js)
const LIVE_STATUS_KEYS = ['live', 'delayed', 'cached', 'stale', 'fallback', 'unavailable'];

async function loadFreshness() {
  const url = new URL('file://' + path.join(ROOT, 'src', 'tracker', 'freshness.js'));
  return import(url.href);
}

test('tracker-ia-guard: every aria-labelledby references an existing id', () => {
  const ids = extractIds(HTML);
  const refs = extractAriaLabelledBy(HTML);
  const dangling = refs.filter((id) => !ids.has(id));
  assert.deepEqual(
    dangling,
    [],
    `dangling aria-labelledby references (no matching id): ${dangling.join(', ')}`
  );
});

test('tracker-ia-guard: STATUS_BADGE_CLASS covers all live-status keys', async () => {
  const { STATUS_BADGE_CLASS } = await loadFreshness();
  for (const key of LIVE_STATUS_KEYS) {
    assert.ok(
      Object.prototype.hasOwnProperty.call(STATUS_BADGE_CLASS, key),
      `STATUS_BADGE_CLASS missing key "${key}"`
    );
    assert.ok(
      typeof STATUS_BADGE_CLASS[key] === 'string' && STATUS_BADGE_CLASS[key].length > 0,
      `STATUS_BADGE_CLASS["${key}"] must be a non-empty string`
    );
  }
});

test('tracker-ia-guard: SOURCE_BADGE_CLASS covers all live-status keys', async () => {
  const { SOURCE_BADGE_CLASS } = await loadFreshness();
  for (const key of LIVE_STATUS_KEYS) {
    assert.ok(
      Object.prototype.hasOwnProperty.call(SOURCE_BADGE_CLASS, key),
      `SOURCE_BADGE_CLASS missing key "${key}"`
    );
    assert.ok(
      typeof SOURCE_BADGE_CLASS[key] === 'string' && SOURCE_BADGE_CLASS[key].length > 0,
      `SOURCE_BADGE_CLASS["${key}"] must be a non-empty string`
    );
  }
});

test('tracker-ia-guard: TRACKER_BADGE_CLASSES values appear in tracker-pro.css', async () => {
  const { TRACKER_BADGE_CLASSES } = await loadFreshness();
  const cssPath = path.join(ROOT, 'styles', 'pages', 'tracker-pro.css');
  const css = fs.readFileSync(cssPath, 'utf8');
  for (const cls of TRACKER_BADGE_CLASSES) {
    assert.ok(
      css.includes('.' + cls),
      `CSS class ".${cls}" from TRACKER_BADGE_CLASSES not found in tracker-pro.css`
    );
  }
});

test('tracker-ia-guard: STATUS_BADGE_CLASS values are in TRACKER_BADGE_CLASSES', async () => {
  const { STATUS_BADGE_CLASS, TRACKER_BADGE_CLASSES } = await loadFreshness();
  const knownClasses = new Set(TRACKER_BADGE_CLASSES);
  for (const [key, cls] of Object.entries(STATUS_BADGE_CLASS)) {
    assert.ok(
      knownClasses.has(cls),
      `STATUS_BADGE_CLASS["${key}"] = "${cls}" is not in TRACKER_BADGE_CLASSES`
    );
  }
});
