'use strict';

/**
 * Operation Midas — Phase 13 cost/abuse guardrail.
 *
 * Every external http(s) origin that client/shared code in src/**\/*.js talks to
 * has a monthly request-budget implication (see docs/plans/midas/COST_MAP.md).
 * If a new external origin is added to a src/ fetch/endpoint/widget without being
 * accounted for in the cost map, the budget silently drifts. This test scans
 * src/**\/*.js for `https?://<host>` literals and fails when a host is neither
 * documented in COST_MAP.md nor listed in the non-network allowlist below.
 *
 * This is a DOC guard, not the pipeline origin logic. It complements — does not
 * duplicate — any provider-order/fetch-chain tests. To satisfy it when you add a
 * new data/embed origin: add the host to the COST_MAP origin ledger. When you add
 * a pure link/vocab host (share button, JSON-LD @context), add it to
 * NON_NETWORK_HOSTS here with a one-word reason.
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const SRC_DIR = path.resolve(__dirname, '..', 'src');
const COST_MAP = path.resolve(__dirname, '..', 'docs', 'plans', 'midas', 'COST_MAP.md');

// Hosts that are NOT network data/embed calls: JSON-LD vocab, XML namespaces,
// social share links, map-attribution links, docs examples, and the site's own
// canonical host. These carry no external request budget, so they are exempt.
const NON_NETWORK_HOSTS = new Set([
  'schema.org', // JSON-LD @context vocab
  'www.w3.org', // xmlns
  'example.com', // placeholder / examples
  'goldtickerlive.com', // self / canonical
  'twitter.com', // share link
  'x.com', // share link
  'wa.me', // WhatsApp share link
  'www.google.com', // search / maps link
  'www.openstreetmap.org', // map attribution link
]);

const HOST_RE = /https?:\/\/([a-zA-Z0-9._-]+)/g;

function collectJsFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...collectJsFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      out.push(full);
    }
  }
  return out;
}

test('every external origin in src/ is documented in COST_MAP.md (or allowlisted)', () => {
  const costMap = fs.readFileSync(COST_MAP, 'utf8');
  const hosts = new Map(); // host -> first file that referenced it

  for (const file of collectJsFiles(SRC_DIR)) {
    const text = fs.readFileSync(file, 'utf8');
    let m;
    while ((m = HOST_RE.exec(text)) !== null) {
      const host = m[1].toLowerCase();
      if (!hosts.has(host)) hosts.set(host, path.relative(SRC_DIR, file));
    }
  }

  const undocumented = [];
  for (const [host, file] of hosts) {
    if (NON_NETWORK_HOSTS.has(host)) continue;
    if (!costMap.includes(host)) undocumented.push(`${host}  (first seen in src/${file})`);
  }

  assert.equal(
    undocumented.length,
    0,
    'New external origin(s) in src/ are not in docs/plans/midas/COST_MAP.md.\n' +
      'Add each host to the COST_MAP origin ledger (a data/embed call) or to\n' +
      'NON_NETWORK_HOSTS in this test (a link/vocab host):\n  ' +
      undocumented.join('\n  ')
  );
});
