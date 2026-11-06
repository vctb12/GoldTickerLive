'use strict';

const { spawnSync } = require('node:child_process');
const assert = require('node:assert/strict');
const path = require('node:path');
const { test } = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function runPython(snippet) {
  return spawnSync(
    'python3',
    ['-c', snippet],
    { cwd: repoRoot, encoding: 'utf8', env: process.env },
  );
}

test('choose_fresher_gold_price prefers newer fetched_at_utc', () => {
  const result = runPython(`
import sys
sys.path.insert(0, "scripts/python")
from merge_gold_price_json_conflicts import choose_fresher_gold_price
upstream = {"fetched_at_utc": "2026-09-30T18:00:00Z", "xau_usd_per_oz": 4100}
incoming = {"fetched_at_utc": "2026-09-30T19:00:00Z", "xau_usd_per_oz": 4155}
chosen = choose_fresher_gold_price(upstream, incoming)
assert chosen["xau_usd_per_oz"] == 4155
`);
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
});

test('choose_fresher_gold_price prefers upstream on timestamp tie', () => {
  const result = runPython(`
import sys
sys.path.insert(0, "scripts/python")
from merge_gold_price_json_conflicts import choose_fresher_gold_price
ts = "2026-09-30T18:00:00Z"
upstream = {"fetched_at_utc": ts, "xau_usd_per_oz": 4100}
incoming = {"fetched_at_utc": ts, "xau_usd_per_oz": 9999}
chosen = choose_fresher_gold_price(upstream, incoming)
assert chosen["xau_usd_per_oz"] == 4100
`);
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
});
