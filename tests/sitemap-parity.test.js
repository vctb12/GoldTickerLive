'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');

const parity = require(path.resolve(__dirname, '../scripts/node/check-sitemap-parity.js'));

// ── Indexation-truth invariants (Phase 24) ──────────────────────────────────
// The sitemap must not lie: every <loc> resolves to a real page, no <lastmod>
// is in the future, and lastmod tracks the git commit date (real content change)
// rather than build-time mtime — so a no-op rebuild does not re-stamp the file.
const REPO_ROOT = path.resolve(__dirname, '..');
const SITEMAP = path.join(REPO_ROOT, 'sitemap.xml');
const GENERATOR = path.join(REPO_ROOT, 'scripts', 'node', 'generate-sitemap.js');
const BASE = 'https://goldtickerlive.com/';

function regen() {
  execFileSync(process.execPath, [GENERATOR], { cwd: REPO_ROOT, stdio: 'ignore' });
  return fs.readFileSync(SITEMAP, 'utf8');
}

function entries(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g)].map((m) => ({
    loc: m[1].trim(),
    lastmod: m[2].trim(),
  }));
}

function fileForLoc(loc) {
  const rel = loc.slice(BASE.length);
  if (rel === '') return 'index.html';
  return rel.endsWith('/') ? rel + 'index.html' : rel;
}

function historyDepth() {
  try {
    return (
      parseInt(
        execFileSync('git', ['rev-list', '--count', 'HEAD'], {
          cwd: REPO_ROOT,
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'ignore'],
        }).trim(),
        10
      ) || 0
    );
  } catch {
    return 0;
  }
}

test('every sitemap <loc> resolves to a real page on disk', () => {
  const rows = entries(regen());
  assert.ok(rows.length > 0, 'sitemap should contain entries');
  const orphans = rows
    .filter(
      ({ loc }) => !loc.startsWith(BASE) || !fs.existsSync(path.join(REPO_ROOT, fileForLoc(loc)))
    )
    .map((r) => r.loc);
  assert.deepEqual(orphans, [], 'sitemap <loc>s with no underlying file: ' + orphans.join(', '));
});

test('every sitemap <lastmod> is a valid past-or-present date (never the future)', () => {
  const today = new Date().toISOString().split('T')[0];
  for (const { loc, lastmod } of entries(regen())) {
    assert.match(lastmod, /^\d{4}-\d{2}-\d{2}$/, `${loc}: malformed lastmod "${lastmod}"`);
    assert.ok(lastmod <= today, `${loc}: lastmod ${lastmod} is in the future (today ${today})`);
  }
});

test('lastmod follows the git commit date, not build-time mtime (no freshness churn)', () => {
  // Only meaningful with real history; a depth-1 (shallow CI) checkout collapses
  // every file's git date onto HEAD, where the generator falls back to the prior
  // committed lastmod instead — a case the other two tests still cover.
  if (historyDepth() <= 1) return;
  const rows = entries(regen());
  let checked = 0;
  for (const { loc, lastmod } of rows) {
    const file = fileForLoc(loc);
    let gitDate;
    try {
      gitDate = execFileSync('git', ['log', '-1', '--format=%cs', '--', file], {
        cwd: REPO_ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
    } catch {
      continue;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(gitDate)) continue; // untracked/generated → mtime fallback
    assert.equal(lastmod, gitDate, `${loc}: lastmod ${lastmod} != git commit date ${gitDate}`);
    checked++;
  }
  assert.ok(checked > 0, 'expected at least one tracked page to confirm git-honest lastmod');
});

test('sitemap ↔ filesystem parity has zero unexplained gaps', () => {
  // Every indexable HTML file is either in the sitemap or explicitly exempt, and
  // no sitemap URL is an orphan. Guards the "completeness or documented reason"
  // contract so a new indexable page cannot silently drop out of the sitemap.
  const sitemap = new Set(entries(regen()).map((e) => e.loc));

  function walk(dir, base = '', out = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue;
      const rel = base ? `${base}/${entry.name}` : entry.name;
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (
          [
            'node_modules',
            'dist',
            'tests',
            'server',
            'supabase',
            'admin',
            'docs',
            'scripts',
            'build',
            'reports',
          ].includes(entry.name)
        )
          continue;
        walk(abs, rel, out);
      } else if (entry.isFile() && entry.name.endsWith('.html')) {
        out.push(rel);
      }
    }
    return out;
  }

  const missing = [];
  for (const rel of walk(REPO_ROOT)) {
    if (parity.isExempt(rel)) continue;
    const html = fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8');
    if (/<meta[^>]+name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html)) continue;
    if (!sitemap.has(parity.toCanonicalUrl(rel))) missing.push(rel);
  }
  assert.deepEqual(
    missing,
    [],
    'indexable pages missing from sitemap (add to sitemap or mark exempt): ' + missing.join(', ')
  );
});

test('toCanonicalUrl maps index and directory paths', () => {
  assert.equal(parity.toCanonicalUrl('index.html'), 'https://goldtickerlive.com/');
  assert.equal(parity.toCanonicalUrl('tracker.html'), 'https://goldtickerlive.com/tracker.html');
  assert.equal(
    parity.toCanonicalUrl('content/guides/index.html'),
    'https://goldtickerlive.com/content/guides/'
  );
});

test('city hub stubs are sitemap exempt', () => {
  assert.ok(
    parity.isExempt('countries/uae/dubai/index.html'),
    'city navigation stubs should not require sitemap entries'
  );
});

test('stub karat hubs and AR mirrors are sitemap exempt', () => {
  assert.ok(parity.isExempt('gold-price/24k/index.html'));
  assert.ok(parity.isExempt('ar/index.html'));
  assert.ok(parity.isExempt('account.html'));
});
