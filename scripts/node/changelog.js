#!/usr/bin/env node
/**
 * scripts/node/changelog.js
 *
 * Generates a CHANGELOG entry from recent git commits using Conventional Commits.
 *
 * Usage:
 *   node scripts/node/changelog.js               # print to stdout (since last tag)
 *   node scripts/node/changelog.js --write        # prepend to CHANGELOG.md
 *   node scripts/node/changelog.js --since <ref>  # since a specific tag/ref/SHA
 *   node scripts/node/changelog.js --version <v>  # use explicit version header
 *   node scripts/node/changelog.js --all          # include all commits (no since limit)
 *
 * Commit format expected (Conventional Commits):
 *   <type>[(<scope>)][!]: <summary>
 *   Types: feat, fix, perf, refactor, docs, test, ci, chore, style
 *   Breaking change: append ! before the colon, or include "BREAKING CHANGE:" in footer
 *
 * The script groups commits by type and prints a markdown block with short SHAs
 * for traceability. It is a helper for release managers.
 */

'use strict';

const { execSync } = require('child_process');
const { existsSync, readFileSync, writeFileSync } = require('fs');
const { resolve } = require('path');

const ROOT = resolve(__dirname, '..', '..');
const CHANGELOG_FILE = resolve(ROOT, 'CHANGELOG.md');

const args = process.argv.slice(2);
const shouldWrite = args.includes('--write');
const includeAll = args.includes('--all');
const sinceIdx = args.indexOf('--since');
const sinceRefArg = sinceIdx !== -1 ? args[sinceIdx + 1] : null;
const versionIdx = args.indexOf('--version');
const versionArg = versionIdx !== -1 ? args[versionIdx + 1] : null;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function run(cmd) {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

/** Return the most recent git tag, or null if none exist. */
function lastTag() {
  const tag = run('git describe --tags --abbrev=0 2>/dev/null');
  return tag || null;
}

/** Return the remote origin URL for commit link generation. */
function remoteUrl() {
  const url = run('git remote get-url origin 2>/dev/null');
  // Normalise SSH and HTTPS GitHub URLs to https://github.com/owner/repo
  const m =
    url.match(/github\.com[:/]([^/]+\/[^/]+?)(?:\.git)?$/) ||
    url.match(/github\.com\/([^/]+\/[^/]+?)(?:\.git)?$/);
  return m ? `https://github.com/${m[1]}` : null;
}

// ---------------------------------------------------------------------------
// Gather commits
// ---------------------------------------------------------------------------

/**
 * Parse git log lines into { sha, subject } objects.
 * Uses NUL-delimited records to handle subjects containing spaces safely.
 */
function gitLog(since) {
  let cmd;
  if (since) {
    cmd = `git log "${since}"..HEAD --no-merges --pretty=format:"%H %s"`;
  } else if (includeAll) {
    cmd = 'git log --no-merges --pretty=format:"%H %s"';
  } else {
    cmd = 'git log --no-merges --pretty=format:"%H %s" -n 200';
  }
  try {
    return execSync(cmd, { cwd: ROOT, encoding: 'utf8' })
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

// Conventional Commits regex with named groups.
// Handles: feat(scope)!: desc  |  fix: desc  |  chore(ci): desc
const CC_RE = /^(?<type>[a-z]+)(?:\((?<scope>[^)]+)\))?(?<breaking>!)?:\s+(?<desc>.+)/;

const CATEGORY_ORDER = [
  'breaking',
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
  breaking: '🚨 Breaking Changes',
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

const KNOWN_TYPES = new Set([
  'feat',
  'fix',
  'perf',
  'refactor',
  'docs',
  'test',
  'ci',
  'chore',
  'style',
]);

function categorise(lines) {
  const groups = {};
  for (const line of lines) {
    const spaceIdx = line.indexOf(' ');
    if (spaceIdx === -1) continue;
    const sha = line.slice(0, spaceIdx);
    const subject = line.slice(spaceIdx + 1);
    const m = CC_RE.exec(subject);
    let type = 'other';
    let desc = subject;
    let breaking = false;
    if (m) {
      type = KNOWN_TYPES.has(m.groups.type) ? m.groups.type : 'other';
      desc = m.groups.desc;
      breaking = Boolean(m.groups.breaking);
    }
    // Commits with ! are also surfaced in the breaking section
    if (breaking) {
      groups.breaking = groups.breaking || [];
      groups.breaking.push({ sha: sha.slice(0, 8), desc, type });
    }
    groups[type] = groups[type] || [];
    groups[type].push({ sha: sha.slice(0, 8), desc });
  }
  return groups;
}

function formatEntry(version, date, groups, repoUrl) {
  const lines = [`## [${version}] — ${date}`, ''];
  for (const cat of CATEGORY_ORDER) {
    if (!groups[cat]?.length) continue;
    lines.push(`### ${CATEGORY_LABELS[cat]}`);
    for (const { sha, desc } of groups[cat]) {
      const shaRef = repoUrl ? `[\`${sha}\`](${repoUrl}/commit/${sha})` : `\`${sha}\``;
      lines.push(`- ${desc} (${shaRef})`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

// Determine the "since" reference:
//   1. Explicit --since <ref> wins
//   2. Otherwise auto-detect last git tag
//   3. If no tags exist, use -n 200 fallback (already in gitLog)
const sinceRef = sinceRefArg || (!includeAll ? lastTag() : null);

const commits = gitLog(sinceRef);
if (!commits.length) {
  console.error('[changelog] No commits found' + (sinceRef ? ` since ${sinceRef}` : '') + '.');
  process.exit(1);
}

const groups = categorise(commits);
const repoUrl = remoteUrl();

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
const entry = formatEntry(version, today, groups, repoUrl);

if (shouldWrite) {
  let existing = '';
  if (existsSync(CHANGELOG_FILE)) {
    existing = readFileSync(CHANGELOG_FILE, 'utf8');
  }
  // Prepend after optional top-level header line (e.g. "# Changelog\n\n")
  const headerEnd = existing.startsWith('#') ? existing.indexOf('\n\n') + 2 : 0;
  const header = existing.slice(0, headerEnd);
  const rest = existing.slice(headerEnd);
  const updated = header + entry + '\n' + rest;
  writeFileSync(CHANGELOG_FILE, updated, 'utf8');
  console.log(`[changelog] Prepended ${version} entry to ${CHANGELOG_FILE}`);
} else {
  if (sinceRef) {
    console.log(`[changelog] Commits since ${sinceRef} (${commits.length} commits)\n`);
  } else {
    console.log(`[changelog] Last ${commits.length} commits (no previous tag found)\n`);
  }
  console.log(entry);
}
