#!/usr/bin/env node
/**
 * scripts/node/changelog.js
 *
 * Generates a CHANGELOG entry from recent git commits.
 *
 * Usage:
 *   node scripts/node/changelog.js               # print to stdout
 *   node scripts/node/changelog.js --write        # prepend to CHANGELOG.md
 *   node scripts/node/changelog.js --since <tag>  # since a specific tag/ref
 *   node scripts/node/changelog.js --version <v>  # use explicit version header
 *
 * Commit format expected (Conventional Commits compatible):
 *   <type>(<scope>): <summary>
 *   Types: feat, fix, perf, refactor, style, docs, test, chore, ci
 *
 * The script groups commits by type and prints a readable markdown block.
 * It is a helper for release managers — not a fully automated CHANGELOG system.
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..', '..');
const CHANGELOG_FILE = resolve(ROOT, 'CHANGELOG.md');

const args = process.argv.slice(2);
const shouldWrite = args.includes('--write');
const sinceIdx = args.indexOf('--since');
const sinceRef = sinceIdx !== -1 ? args[sinceIdx + 1] : null;
const versionIdx = args.indexOf('--version');
const versionArg = versionIdx !== -1 ? args[versionIdx + 1] : null;

// ---------------------------------------------------------------------------
// Gather commits
// ---------------------------------------------------------------------------

function gitLog(since) {
  const cmd = since
    ? `git log "${since}"..HEAD --no-merges --pretty=format:"%H %s" --`
    : 'git log --no-merges --pretty=format:"%H %s" -n 100 --';
  try {
    return execSync(cmd, { cwd: ROOT, encoding: 'utf8' })
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

const CATEGORY_ORDER = [
  'feat',
  'fix',
  'perf',
  'refactor',
  'docs',
  'test',
  'ci',
  'chore',
  'style',
  'other',
];
const CATEGORY_LABELS = {
  feat: '✨ Features',
  fix: '🐛 Bug Fixes',
  perf: '⚡ Performance',
  refactor: '♻️ Refactors',
  docs: '📝 Documentation',
  test: '✅ Tests',
  ci: '🤖 CI/CD',
  chore: '🔧 Chores',
  style: '🎨 Style',
  other: '📦 Other',
};

function categorise(lines) {
  const groups = {};
  for (const line of lines) {
    const [sha, ...rest] = line.split(' ');
    const msg = rest.join(' ');
    const match = msg.match(/^(\w+)(\([\w/-]+\))?[!:]?\s*:?\s*(.+)/);
    let type = 'other';
    let summary = msg;
    if (match) {
      type = CATEGORY_ORDER.includes(match[1]) ? match[1] : 'other';
      summary = match[3] || msg;
    }
    if (!groups[type]) groups[type] = [];
    groups[type].push({ sha: sha.slice(0, 8), summary });
  }
  return groups;
}

function formatEntry(version, date, groups) {
  const lines = [`## [${version}] — ${date}`, ''];
  for (const cat of CATEGORY_ORDER) {
    if (!groups[cat]?.length) continue;
    lines.push(`### ${CATEGORY_LABELS[cat]}`);
    for (const { sha, summary } of groups[cat]) {
      lines.push(`- ${summary} (\`${sha}\`)`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const commits = gitLog(sinceRef);
if (!commits.length) {
  console.error('[changelog] No commits found.');
  process.exit(1);
}

const groups = categorise(commits);

// Derive version from package.json if not provided
let version = versionArg;
if (!version) {
  try {
    const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8'));
    version = `v${pkg.version || 'unreleased'}`;
  } catch {
    version = 'Unreleased';
  }
}

const today = new Date().toISOString().slice(0, 10);
const entry = formatEntry(version, today, groups);

if (shouldWrite) {
  let existing = '';
  if (existsSync(CHANGELOG_FILE)) {
    existing = readFileSync(CHANGELOG_FILE, 'utf8');
  }
  // Prepend after optional header line
  const headerEnd = existing.startsWith('#') ? existing.indexOf('\n\n') + 2 : 0;
  const header = existing.slice(0, headerEnd);
  const rest = existing.slice(headerEnd);
  const updated = header + entry + '\n' + rest;
  writeFileSync(CHANGELOG_FILE, updated, 'utf8');
  console.log(`[changelog] Prepended ${version} entry to ${CHANGELOG_FILE}`);
} else {
  console.log(entry);
}
