#!/usr/bin/env node
/**
 * scripts/node/pre-deploy-check.js
 *
 * Go / No-Go pre-deploy checklist. Runs the full validation suite plus a
 * handful of additional heuristic checks and prints a structured summary.
 *
 * Usage:
 *   node scripts/node/pre-deploy-check.js           # full check
 *   node scripts/node/pre-deploy-check.js --ci      # exits 1 on any failure
 *
 * Integrates with the `validate` npm script group. Does NOT rebuild the site —
 * run `npm run build` first if you need a fresh bundle.
 *
 * Checks performed:
 *   1. data/gold_price.json present and not zero-bytes (critical)
 *   2. Sitemap file present and >= 50 URLs (critical)
 *   3. dist/ directory present if built (warning)
 *   4. No .env or secrets files checked in (critical)
 *   5. Service-worker registered on index.html (warning)
 *   6. CNAME file present (warning — Pages deployment)
 *   7. data/shops-data.json parseable JSON (critical)
 */

'use strict';

import { readFileSync, existsSync, statSync } from 'fs';
import { resolve, join } from 'path';
import { execSync } from 'child_process';

const ROOT = resolve(new URL('.', import.meta.url).pathname, '..', '..');
const CI_MODE = process.argv.includes('--ci');

const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

let failures = 0;
let warnings = 0;

function ok(label) {
  console.log(`  ${GREEN}✔${RESET}  ${label}`);
}
function warn(label, detail = '') {
  console.log(`  ${YELLOW}⚠${RESET}  ${YELLOW}${label}${RESET}${detail ? ` — ${detail}` : ''}`);
  warnings++;
}
function fail(label, detail = '') {
  console.log(`  ${RED}✖${RESET}  ${RED}${label}${RESET}${detail ? ` — ${detail}` : ''}`);
  failures++;
}

function section(title) {
  console.log(`\n${BOLD}${title}${RESET}`);
}

// ---------------------------------------------------------------------------
// 1. data/gold_price.json
// ---------------------------------------------------------------------------
section('1. Gold price data file');
const goldFile = join(ROOT, 'data/gold_price.json');
if (!existsSync(goldFile)) {
  fail('data/gold_price.json is missing', 'run the gold-price-fetch workflow first');
} else if (statSync(goldFile).size === 0) {
  fail('data/gold_price.json is zero bytes');
} else {
  try {
    const d = JSON.parse(readFileSync(goldFile, 'utf8'));
    const price = d?.gold?.ounce_usd;
    if (typeof price !== 'number' || price <= 0) throw new Error('invalid price');
    const ageMs = Date.now() - new Date(d.fetched_at_utc || 0).getTime();
    const ageHours = (ageMs / 3_600_000).toFixed(1);
    if (ageHours > 24) {
      warn(`gold_price.json is ${ageHours} h old — may be stale`);
    } else {
      ok(`gold_price.json present — XAU/USD $${price.toFixed(2)} (${ageHours} h old)`);
    }
  } catch (e) {
    fail('gold_price.json is not valid JSON', e.message);
  }
}

// ---------------------------------------------------------------------------
// 2. Sitemap
// ---------------------------------------------------------------------------
section('2. Sitemap');
const sitemapFile = join(ROOT, 'sitemap.xml');
if (!existsSync(sitemapFile)) {
  fail('sitemap.xml is missing');
} else {
  const content = readFileSync(sitemapFile, 'utf8');
  const count = (content.match(/<url>/g) || []).length;
  if (count < 50) {
    fail(`sitemap.xml has only ${count} URLs (expected ≥ 50)`);
  } else {
    ok(`sitemap.xml has ${count} URLs`);
  }
}

// ---------------------------------------------------------------------------
// 3. dist/ directory (optional — only when built)
// ---------------------------------------------------------------------------
section('3. Build output');
const distDir = join(ROOT, 'dist');
if (!existsSync(distDir)) {
  warn('dist/ directory not found', 'run npm run build before deploying');
} else {
  const indexInDist = join(distDir, 'index.html');
  if (!existsSync(indexInDist)) {
    fail('dist/index.html is missing — build may be incomplete');
  } else {
    ok('dist/index.html present');
  }
}

// ---------------------------------------------------------------------------
// 4. No secrets checked in
// ---------------------------------------------------------------------------
section('4. Secrets / sensitive files');
const sensitivePatterns = ['.env', '.env.local', '.env.production', 'secrets.json'];
let secretsFound = false;
for (const p of sensitivePatterns) {
  const f = join(ROOT, p);
  if (existsSync(f)) {
    fail(`${p} is present in the repo root — must not be committed`, 'check .gitignore');
    secretsFound = true;
  }
}
if (!secretsFound) ok('No .env / secrets files found in repo root');

// Also check that data/users.json (if present) is not world-readable
const usersFile = join(ROOT, 'data/users.json');
// 0o044 = group-read (4) + other-read (4). Any file used for admin credentials
// should not be readable by group or world.
const GROUP_OTHER_READ = 0o044;
if (existsSync(usersFile)) {
  try {
    const mode = statSync(usersFile).mode & 0o777;
    if (mode & GROUP_OTHER_READ) {
      warn(
        `data/users.json has world/group read permission (${mode.toString(8)})`,
        'run: chmod 600 data/users.json'
      );
    } else {
      ok(`data/users.json permissions are tight (${mode.toString(8)})`);
    }
  } catch {
    warn('Could not stat data/users.json');
  }
}

// ---------------------------------------------------------------------------
// 5. Service worker
// ---------------------------------------------------------------------------
section('5. Service worker');
const indexHtml = join(ROOT, 'index.html');
if (!existsSync(indexHtml)) {
  warn('index.html not found — cannot check SW registration');
} else {
  const html = readFileSync(indexHtml, 'utf8');
  if (html.includes('serviceWorker') && html.includes('sw.js')) {
    ok('Service worker registration found in index.html');
  } else {
    warn('Service worker registration not found in index.html');
  }
}

// ---------------------------------------------------------------------------
// 6. CNAME
// ---------------------------------------------------------------------------
section('6. GitHub Pages CNAME');
const cnameFile = join(ROOT, 'CNAME');
if (!existsSync(cnameFile)) {
  warn('CNAME file is missing', 'custom domain will not be set on GitHub Pages');
} else {
  const cname = readFileSync(cnameFile, 'utf8').trim();
  ok(`CNAME → ${cname}`);
}

// ---------------------------------------------------------------------------
// 7. shops-data.json
// ---------------------------------------------------------------------------
section('7. Shops data');
const shopsFile = join(ROOT, 'data/shops-data.json');
if (!existsSync(shopsFile)) {
  warn('data/shops-data.json not found', 'shops directory will be empty');
} else {
  try {
    const shops = JSON.parse(readFileSync(shopsFile, 'utf8'));
    if (!Array.isArray(shops)) throw new Error('not an array');
    ok(`data/shops-data.json is valid JSON with ${shops.length} entries`);
  } catch (e) {
    fail('data/shops-data.json is not valid JSON', e.message);
  }
}

// ---------------------------------------------------------------------------
// 8. Run existing validate script (non-blocking in summary mode)
// ---------------------------------------------------------------------------
section('8. npm run validate');
try {
  execSync('npm run validate', { cwd: ROOT, stdio: 'ignore' });
  ok('npm run validate passed');
} catch {
  fail('npm run validate failed', 'run npm run validate for details');
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log('\n' + '─'.repeat(60));
if (failures === 0 && warnings === 0) {
  console.log(`${GREEN}${BOLD}✔ All pre-deploy checks passed — ready to deploy.${RESET}`);
} else if (failures === 0) {
  console.log(
    `${YELLOW}${BOLD}⚠ ${warnings} warning(s), 0 failures — review before deploying.${RESET}`
  );
} else {
  console.log(
    `${RED}${BOLD}✖ ${failures} failure(s), ${warnings} warning(s) — fix before deploying.${RESET}`
  );
}
console.log('─'.repeat(60));

if (CI_MODE && failures > 0) {
  process.exit(1);
}
