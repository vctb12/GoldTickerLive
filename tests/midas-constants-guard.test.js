'use strict';

/**
 * Operation Midas — Phase 5 duplication guard.
 *
 * The peg (3.6725) and troy-ounce (31.103…) literals must live in the canonical
 * modules only. Any new copy pasted into a script silently forks the price math,
 * so this test scans scripts/**\/*.{js,mjs,py} and fails listing offenders.
 *
 * Scope: scripts/ only. src/ has its own single source (src/config/constants.js,
 * owner-gated) and docs / translations are copy, tracked separately.
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const SCRIPTS_DIR = path.resolve(__dirname, '..', 'scripts');
const LITERAL_RE = /3\.6725|31\.103/;
const EXTENSIONS = new Set(['.js', '.mjs', '.py']);

/**
 * Allowlist — the ONLY places in scripts/ where the literals may appear.
 * Values: 'all' (a canonical constants module or pipeline writer may carry the
 * literal anywhere in the file) or an array of RegExps matched against each
 * offending line (only those exact line shapes are allowed).
 * Paths are repo-relative with forward slashes.
 */
const ALLOWLIST = {
  // Canonical Node script-tier constants module (created in Midas phase 5).
  'scripts/node/lib/price-constants.js': 'all',
  // Canonical Python re-export module (values appear in its docstring).
  'scripts/python/utils/constants.py': 'all',
  // Pipeline writers — the origin of the pipeline-exact values.
  'scripts/python/gold_providers/base.py': 'all',
  'scripts/python/fetch_gold_price.py': 'all',
  'scripts/python/post_gold_price.py': 'all',
  // QA scanner that greps built output FOR these literals by design.
  'scripts/qa/parity-diff-scan.mjs': 'all',
  // Tweet copy: educational one-liners quoting the facts to readers. Copy, not
  // math — only string literals in the gold-facts pool are allowed.
  'scripts/node/tweet-gold-price.js': [/^\s*['"“].*(troy ounce|pegged)/i],
};

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (EXTENSIONS.has(path.extname(entry.name))) out.push(full);
  }
  return out;
}

test('duplication guard: peg/troy literals appear only in the canonical allowlisted modules', () => {
  const repoRoot = path.resolve(__dirname, '..');
  const offenders = [];

  for (const file of walk(SCRIPTS_DIR)) {
    const rel = path.relative(repoRoot, file).split(path.sep).join('/');
    const allowed = ALLOWLIST[rel];
    if (allowed === 'all') continue;

    const lines = fs.readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, i) => {
      if (!LITERAL_RE.test(line)) return;
      if (Array.isArray(allowed) && allowed.some((re) => re.test(line))) return;
      offenders.push(`${rel}:${i + 1}: ${line.trim()}`);
    });
  }

  assert.deepStrictEqual(
    offenders,
    [],
    'Peg/troy literal duplicated outside the canonical modules.\n' +
      'Import from scripts/node/lib/price-constants.js (Node) or ' +
      'scripts/python/utils/constants.py / gold_providers/base.py (Python) instead.\n' +
      offenders.join('\n')
  );
});

test('duplication guard: the allowlist itself stays honest (canonical files exist)', () => {
  const repoRoot = path.resolve(__dirname, '..');
  for (const rel of Object.keys(ALLOWLIST)) {
    assert.ok(fs.existsSync(path.join(repoRoot, rel)), `allowlisted file exists: ${rel}`);
  }
});
