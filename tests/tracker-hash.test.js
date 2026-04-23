'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

// §22b Phase 7 — freeze the tracker URL-hash contract. See docs/tracker-state.md.
// These round-trip tests are the enforcement mechanism for the invariants listed there.

async function load() {
  const url = new URL('file://' + path.resolve(__dirname, '..', 'src', 'tracker', 'state.js'));
  return import(url.href);
}

test('parseHash: empty hash → no hasHash, nothing to canonicalize', async () => {
  const { parseHash } = await load();
  const out = parseHash('');
  assert.equal(out.hasHash, false);
  assert.equal(out.mode, null);
  assert.equal(out.panel, null);
  assert.equal(out.shouldCanonicalize, false);
});

test('parseHash: valid full hash preserves every param', async () => {
  const { parseHash } = await load();
  const out = parseHash('mode=compare&cur=AED&k=22&u=gram&r=30D&cmp=USD&lang=en');
  assert.equal(out.hasHash, true);
  assert.equal(out.mode, 'compare');
  assert.equal(out.panel, null);
  assert.equal(out.shouldCanonicalize, false);
  assert.equal(out.params.get('cur'), 'AED');
  assert.equal(out.params.get('k'), '22');
  assert.equal(out.params.get('u'), 'gram');
  assert.equal(out.params.get('r'), '30D');
  assert.equal(out.params.get('cmp'), 'USD');
  assert.equal(out.params.get('lang'), 'en');
});

test('parseHash: every VALID_MODES value round-trips without canonicalization', async () => {
  const { parseHash, VALID_MODES } = await load();
  for (const mode of VALID_MODES) {
    const out = parseHash(`mode=${mode}&cur=USD&k=24&u=gram&r=30D&cmp=AED&lang=en`);
    assert.equal(out.mode, mode, `mode ${mode} should survive round-trip`);
    assert.equal(out.shouldCanonicalize, false, `mode ${mode} should not request canonicalization`);
  }
});

test('parseHash: unknown mode → live + canonicalize', async () => {
  const { parseHash } = await load();
  const out = parseHash('mode=bogus&cur=AED&k=24&u=gram&r=30D&cmp=USD&lang=en');
  assert.equal(out.mode, 'live');
  assert.equal(out.shouldCanonicalize, true);
});

test('parseHash: unknown panel is dropped, canonicalize, mode preserved', async () => {
  const { parseHash } = await load();
  const out = parseHash('mode=archive&panel=bogus&cur=AED&k=24&u=gram&r=30D&cmp=USD&lang=en');
  assert.equal(out.mode, 'archive');
  assert.equal(out.panel, null);
  assert.equal(out.shouldCanonicalize, true);
});

test('parseHash: panel without mode resolves to mode=live', async () => {
  const { parseHash } = await load();
  const out = parseHash('panel=alerts');
  assert.equal(out.mode, 'live');
  assert.equal(out.panel, 'alerts');
  assert.equal(out.shouldCanonicalize, true);
});

test('parseHash: known mode + known panel parses cleanly', async () => {
  const { parseHash } = await load();
  const out = parseHash('mode=live&panel=planner&cur=AED&k=24&u=gram&r=30D&cmp=USD&lang=en');
  assert.equal(out.mode, 'live');
  assert.equal(out.panel, 'planner');
  assert.equal(out.shouldCanonicalize, false);
});

test('parseHash: legacy #alerts shortcut canonicalizes to live+alerts', async () => {
  const { parseHash } = await load();
  for (const legacy of ['alerts', 'section-alerts']) {
    const out = parseHash(legacy);
    assert.equal(out.mode, 'live', `legacy ${legacy} should map to live`);
    assert.equal(out.panel, 'alerts', `legacy ${legacy} should map to alerts panel`);
    assert.equal(out.shouldCanonicalize, true, `legacy ${legacy} should trigger canonicalization`);
  }
});

test('parseHash: legacy mode=alerts canonicalizes to mode=live + panel=alerts', async () => {
  const { parseHash } = await load();
  const out = parseHash('mode=alerts&cur=AED&k=24');
  assert.equal(out.mode, 'live');
  assert.equal(out.panel, 'alerts');
  assert.equal(out.shouldCanonicalize, true);
});

test('VALID_MODES and VALID_PANELS match the documented contract', async () => {
  const { VALID_MODES, VALID_PANELS } = await load();
  // Hard-coded against docs/tracker-state.md. Changing the sets here requires
  // updating the docs and the §22b Phase 7 log in REVAMP_PLAN.md.
  assert.deepEqual([...VALID_MODES].sort(), ['archive', 'compare', 'exports', 'live', 'method']);
  assert.deepEqual([...VALID_PANELS].sort(), ['alerts', 'planner']);
});
