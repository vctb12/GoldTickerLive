'use strict';

/**
 * Deploy data/ allowlist guard (Operation Midas, phase 10 — exposure sweep).
 *
 * deploy.yml raw-copied the whole `data/` tree into `dist/`, publishing internal
 * automation/persistence state (billing.json, leads.json,
 * newsletter-subscribers.json, audit-logs.json, alerts-v1.json,
 * automation_runs.json, tweet_*.json, last_tweet_state.json, provider_state.json,
 * ai-drafts.json, link-audit.json, shops-data.json) to the public CDN. None of
 * those are fetched by any browser — they are read only by server/ routes or
 * scripts/.
 *
 * This is a tripwire: it fails if a future edit reintroduces a blanket
 * `cp -r data dist/`, drops a public file the client actually fetches, or adds a
 * copy of any internal data file into the deployed bundle.
 *
 * See docs/plans/midas/EXPOSURE_REPORT.md for the per-file consumer citations.
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const DEPLOY_YML = path.resolve(__dirname, '..', '.github', 'workflows', 'deploy.yml');

// Files a deployed browser actually loads from /data/ (see EXPOSURE_REPORT.md).
const PUBLIC_ALLOWLIST = ['gold_price.json', 'last_gold_price.json', 'shops.js', 'index.html'];

// Internal automation/persistence state — read only by server/ or scripts/,
// never fetched by a browser. Must NEVER be copied into dist/.
const INTERNAL_NEVER_SHIP = [
  'billing.json',
  'leads.json',
  'newsletter-subscribers.json',
  'audit-logs.json',
  'alerts-v1.json',
  'automation_runs.json',
  'tweet_posts.json',
  'tweet_failures.json',
  'last_tweet_state.json',
  'provider_state.json',
  'ai-drafts.json',
  'link-audit.json',
  'shops-data.json',
];

function readDeployYml() {
  return fs.readFileSync(DEPLOY_YML, 'utf8');
}

/** Lines that are actual shell commands (comments and blanks stripped). */
function commandLines(content) {
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'));
}

test('deploy.yml never blanket-copies the data/ tree', () => {
  const commands = commandLines(readDeployYml());
  const blanket = commands.filter((line) => /\bcp\b.*-r\b.*\bdata\b\s+dist\/?/.test(line));
  assert.deepEqual(
    blanket,
    [],
    `Found blanket data/ copy command(s) — this publishes internal state to the public CDN:\n${blanket.join('\n')}`
  );
});

test('deploy.yml copies every public-needed data file explicitly', () => {
  const commands = commandLines(readDeployYml());
  for (const file of PUBLIC_ALLOWLIST) {
    const escaped = file.replace(/[.]/g, '\\.');
    const re = new RegExp(`\\bcp\\b\\s+data\\/${escaped}\\s+dist\\/data\\/?`);
    const found = commands.some((line) => re.test(line));
    assert.ok(
      found,
      `Public data file "${file}" is missing from the deploy allowlist (client fetches it).`
    );
  }
});

test('deploy.yml never copies any internal data file into the bundle', () => {
  const commands = commandLines(readDeployYml());
  for (const file of INTERNAL_NEVER_SHIP) {
    const escaped = file.replace(/[.]/g, '\\.');
    // Any copy command whose source is this internal file is forbidden.
    const re = new RegExp(`\\bcp\\b[^\\n]*\\bdata\\/${escaped}\\b`);
    const offenders = commands.filter((line) => re.test(line));
    assert.deepEqual(
      offenders,
      [],
      `Internal data file "${file}" must never be copied into dist/ (it is server/script-only):\n${offenders.join('\n')}`
    );
  }
});

test('public allowlist and internal denylist do not overlap', () => {
  const overlap = PUBLIC_ALLOWLIST.filter((f) => INTERNAL_NEVER_SHIP.includes(f));
  assert.deepEqual(
    overlap,
    [],
    `A file is classified as both public and internal: ${overlap.join(', ')}`
  );
});
