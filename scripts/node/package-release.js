#!/usr/bin/env node
/**
 * scripts/node/package-release.js
 *
 * Packages a deployable release artifact from the current dist/ build.
 *
 * Usage:
 *   node scripts/node/package-release.js              # package release
 *   node scripts/node/package-release.js --dry-run    # print plan without writing
 *
 * Output — written to release/:
 *   release.json              metadata: brand, version, buildSha, buildTimestamp
 *   CHANGELOG.md              copy of root CHANGELOG.md
 *   gold-ticker-live-<v>.tar.gz  tarball containing dist/ + CHANGELOG.md + release.json
 *
 * NOTES:
 *   - Does NOT tag git or publish anywhere — artifact-only; promotion is a human step.
 *   - Requires `npm run build` to have been run first (dist/ must exist).
 *   - Tagging via git only happens in CI on the main branch, not locally.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const DIST = path.join(ROOT, 'dist');
const RELEASE_DIR = path.join(ROOT, 'release');
const DRY_RUN = process.argv.includes('--dry-run');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: 'utf8', ...opts }).trim();
  } catch {
    return '';
  }
}

function log(msg) {
  console.log(`  ${msg}`);
}

function abort(msg) {
  console.error(`\n  ✖  ${msg}\n`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Gather metadata (before pre-flight so --dry-run can show the plan)
// ---------------------------------------------------------------------------

let pkg;
try {
  pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
} catch {
  abort('Could not read package.json');
}

const brand = 'Gold Ticker Live';
const version = `v${pkg.version || '0.0.0'}`;
const buildSha = run('git rev-parse --short HEAD') || 'unknown';
const buildTimestamp = new Date().toISOString();

const tarballName = `gold-ticker-live-${version}-${buildSha}.tar.gz`;
const tarballPath = path.join(RELEASE_DIR, tarballName);

console.log('\n  📦  Packaging release artifact\n');
log(`  Brand      : ${brand}`);
log(`  Version    : ${version}`);
log(`  Build SHA  : ${buildSha}`);
log(`  Timestamp  : ${buildTimestamp}`);
log(`  Tarball    : release/${tarballName}`);
console.log('');

if (DRY_RUN) {
  console.log('  [dry-run] No files written.\n');
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Pre-flight (after dry-run exit)
// ---------------------------------------------------------------------------

if (!fs.existsSync(DIST)) {
  abort('dist/ not found — run npm run build first.');
}
if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  abort('dist/index.html missing — build may be incomplete.');
}

// ---------------------------------------------------------------------------
// Build release.json
// ---------------------------------------------------------------------------

const releaseJson = {
  brand,
  version,
  buildSha,
  buildTimestamp,
  distFiles: collectDistFiles(),
};

function collectDistFiles() {
  const files = [];
  function walk(dir) {
    for (const name of fs.readdirSync(dir)) {
      const p = path.join(dir, name);
      const stat = fs.statSync(p);
      if (stat.isDirectory()) walk(p);
      else files.push({ path: path.relative(DIST, p), size: stat.size });
    }
  }
  walk(DIST);
  return files;
}

// ---------------------------------------------------------------------------
// Write artifacts
// ---------------------------------------------------------------------------

if (!fs.existsSync(RELEASE_DIR)) {
  fs.mkdirSync(RELEASE_DIR, { recursive: true });
}

// release.json
const releaseJsonPath = path.join(RELEASE_DIR, 'release.json');
fs.writeFileSync(releaseJsonPath, JSON.stringify(releaseJson, null, 2) + '\n', 'utf8');
log('✔  Wrote release/release.json');

// Copy CHANGELOG.md
const changelogSrc = path.join(ROOT, 'CHANGELOG.md');
const changelogDest = path.join(RELEASE_DIR, 'CHANGELOG.md');
if (fs.existsSync(changelogSrc)) {
  fs.copyFileSync(changelogSrc, changelogDest);
  log('✔  Copied CHANGELOG.md → release/CHANGELOG.md');
} else {
  log('⚠  CHANGELOG.md not found — skipping copy');
}

// Create tarball: dist/ + release/CHANGELOG.md + release/release.json
// Structure inside the tarball:
//   ./              (contents of dist/)
//   CHANGELOG.md    (from release/CHANGELOG.md)
//   release.json    (from release/release.json)
try {
  // We stage the extra files next to dist/ temporarily using a staging layout
  const stagingDir = path.join(RELEASE_DIR, '.staging');
  if (fs.existsSync(stagingDir)) fs.rmSync(stagingDir, { recursive: true, force: true });
  fs.mkdirSync(stagingDir, { recursive: true });

  // Copy dist/* into staging
  run(`cp -r ${DIST}/. ${stagingDir}/`);

  // Add CHANGELOG.md and release.json into staging root
  if (fs.existsSync(changelogDest)) {
    fs.copyFileSync(changelogDest, path.join(stagingDir, 'CHANGELOG.md'));
  }
  fs.copyFileSync(releaseJsonPath, path.join(stagingDir, 'release.json'));

  // Create the tarball from staging
  execSync(`tar -czf "${tarballPath}" -C "${stagingDir}" .`, { cwd: ROOT });

  // Clean up staging
  fs.rmSync(stagingDir, { recursive: true, force: true });

  log(`✔  Created release/${tarballName}`);
} catch (err) {
  abort(`Failed to create tarball: ${err.message}`);
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

const tarSize = fs.existsSync(tarballPath)
  ? (fs.statSync(tarballPath).size / 1024).toFixed(1) + ' KB'
  : 'unknown';

console.log('\n  ─────────────────────────────────────────────────────');
console.log('  ✔  Release packaged successfully');
console.log('     release/release.json          (metadata)');
console.log('     release/CHANGELOG.md          (changelog copy)');
console.log(`     release/${tarballName}`);
console.log(`     Tarball size: ${tarSize} | Files in dist: ${releaseJson.distFiles.length}`);
console.log('  ─────────────────────────────────────────────────────\n');
console.log('  NOTE: To publish, promote this artifact manually.');
console.log('        Git tagging is done by CI on main — not by this script.\n');
