'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

// 20-phase tracker redesign — Phase 7. Locks the mode-tab registry contract:
//   - order matches tracker.html markup order,
//   - every VALID_MODES / VALID_PANELS entry is represented,
//   - bilingual labels ship, shortcuts are unique, no duplicate DOM ids.

async function loadModes() {
  const url = new URL('file://' + path.resolve(__dirname, '..', 'src', 'tracker', 'modes.js'));
  return import(url.href);
}

async function loadState() {
  const url = new URL('file://' + path.resolve(__dirname, '..', 'src', 'tracker', 'state.js'));
  return import(url.href);
}

test('tracker-modes: registry invariants hold', async () => {
  const { assertRegistryInvariants } = await loadModes();
  assert.equal(assertRegistryInvariants(), true);
});

test('tracker-modes: modes and panels partition the tab registry', async () => {
  const { TRACKER_TABS, TRACKER_MODES, TRACKER_PANELS } = await loadModes();
  assert.equal(
    TRACKER_MODES.length + TRACKER_PANELS.length,
    TRACKER_TABS.length,
    'TRACKER_TABS must partition exactly into modes + panels'
  );
  for (const tab of TRACKER_MODES) assert.equal(tab.kind, 'mode');
  for (const tab of TRACKER_PANELS) assert.equal(tab.kind, 'panel');
});

test('tracker-modes: every VALID_MODES id is represented', async () => {
  const [{ TRACKER_MODES }, { VALID_MODES }] = await Promise.all([loadModes(), loadState()]);
  const registryIds = new Set(TRACKER_MODES.map((t) => t.id));
  for (const mode of VALID_MODES) {
    assert.ok(registryIds.has(mode), `mode "${mode}" missing from registry`);
  }
});

test('tracker-modes: every VALID_PANELS id is represented', async () => {
  const [{ TRACKER_PANELS }, { VALID_PANELS }] = await Promise.all([loadModes(), loadState()]);
  const registryIds = new Set(TRACKER_PANELS.map((t) => t.id));
  for (const panel of VALID_PANELS) {
    assert.ok(registryIds.has(panel), `panel "${panel}" missing from registry`);
  }
});

test('tracker-modes: shortcut map has no duplicates and uses [a-z] only', async () => {
  const { getShortcutMap } = await loadModes();
  const map = getShortcutMap();
  assert.ok(map.size > 0, 'at least one shortcut required');
  for (const key of map.keys()) {
    assert.match(key, /^[a-z]$/, `shortcut "${key}" must be a single lowercase letter`);
  }
});

test('tracker-modes: every entry ships bilingual labels', async () => {
  const { TRACKER_TABS } = await loadModes();
  for (const tab of TRACKER_TABS) {
    assert.ok(tab.label.en && tab.label.en.length > 0, `${tab.id}: EN label required`);
    assert.ok(tab.label.ar && tab.label.ar.length > 0, `${tab.id}: AR label required`);
  }
});

test('tracker-modes: getTrackerTab returns undefined for unknown id', async () => {
  const { getTrackerTab } = await loadModes();
  assert.equal(getTrackerTab('not-a-mode'), undefined);
  assert.ok(getTrackerTab('live'), 'live must resolve');
});

test('tracker-modes: registry order matches tracker.html tab order', async () => {
  const { TRACKER_TABS } = await loadModes();
  const html = fs.readFileSync(path.resolve(__dirname, '..', 'tracker.html'), 'utf8');
  const registryTabIds = TRACKER_TABS.map((t) => t.tabId);
  const idPattern = /id="(tab-[a-z]+)"/g;
  const htmlTabIds = [];
  let m;
  while ((m = idPattern.exec(html))) {
    if (registryTabIds.includes(m[1])) htmlTabIds.push(m[1]);
  }
  assert.deepEqual(
    htmlTabIds,
    registryTabIds,
    'tracker.html tab order must match src/tracker/modes.js registry order'
  );
});
