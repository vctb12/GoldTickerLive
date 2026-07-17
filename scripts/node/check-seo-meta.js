#!/usr/bin/env node
/*
 * phx/16: SEO meta regression guard.
 * Verifies every public HTML page has a canonical link and hreflang alternates,
 * and that admin/internal pages are marked noindex. Runs under `npm run validate`.
 *
 * Exit code 1 on failure so CI catches regressions.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');

// Paths that are treated as non-public (must be noindex, no canonical/hreflang required).
const INTERNAL_PREFIXES = [
  'admin/',
  'config/',
  'data/',
  'docs/',
  'scripts/',
  'server/',
  'src/',
  'styles/',
  'supabase/',
  'build/',
  'tests/',
  'node_modules/',
  'dist/',
  'playwright-report/',
  'test-results/',
  'content/embed/', // embed stubs are served via iframe, not indexed
];

// Individual files that are intentionally exempt from canonical/hreflang.
const EXEMPT_FILES = new Set(['404.html', 'offline.html']);

// Redirect stubs (short HTML that meta-refreshes to canonical target) only need canonical.
function isRedirectStub(html) {
  return /http-equiv="refresh"/i.test(html) && html.length < 4000;
}

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(ROOT, full);
    if (entry.isDirectory()) {
      if (
        rel.startsWith('node_modules') ||
        rel.startsWith('dist') ||
        rel.startsWith('playwright-report') ||
        rel.startsWith('test-results') ||
        rel.startsWith('.git')
      )
        continue;
      walk(full, acc);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      acc.push(rel);
    }
  }
  return acc;
}

function isInternal(rel) {
  return INTERNAL_PREFIXES.some((p) => rel.startsWith(p));
}

// Extract the trimmed inner text of the first <title>, or null.
function titleOf(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].replace(/\s+/g, ' ').trim() : null;
}

// Extract the first meta description content attribute, or null.
function descriptionOf(html) {
  const m = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/i);
  return m ? m[1].replace(/\s+/g, ' ').trim() : null;
}

function main() {
  const files = walk(ROOT);
  const errors = [];

  // Uniqueness ledgers for public, indexable pages. Two pages sharing a <title>
  // or a meta description dilute their own search relevance and read as
  // duplicate/thin content — so we fail the build on any collision.
  const titleOwners = new Map(); // normalized title -> [rel, ...]
  const descOwners = new Map(); // normalized description -> [rel, ...]

  for (const rel of files) {
    if (EXEMPT_FILES.has(rel)) continue;
    const html = fs.readFileSync(path.join(ROOT, rel), 'utf8');

    if (isInternal(rel)) {
      if (!/name="robots"[^>]*noindex/i.test(html)) {
        errors.push(`${rel}: internal page missing <meta name="robots" content="noindex,...">`);
      }
      continue;
    }

    // Pages explicitly marked noindex are treated as internal/scaffolded regardless of location.
    if (/name="robots"[^>]*noindex/i.test(html)) {
      continue;
    }

    // Dead-weight meta keywords tag: ignored by every major search engine and a
    // maintenance hazard (drifts out of sync with real copy). Not allowed on
    // public pages.
    if (/<meta[^>]*name="keywords"/i.test(html)) {
      errors.push(`${rel}: remove obsolete <meta name="keywords"> (ignored by search engines)`);
    }

    // Public page — must have canonical
    const canonicalMatches = html.match(/rel="canonical"/g) || [];
    if (canonicalMatches.length === 0) {
      errors.push(`${rel}: missing <link rel="canonical">`);
    } else if (canonicalMatches.length > 1) {
      errors.push(`${rel}: ${canonicalMatches.length} canonical links (expected 1)`);
    }

    // Canonical must use production host
    const canonUrl = (html.match(/rel="canonical"\s+href="([^"]+)"/) || [])[1];
    if (canonUrl && !/^https:\/\/goldtickerlive\.com\//.test(canonUrl)) {
      errors.push(`${rel}: canonical does not use https://goldtickerlive.com/ (got ${canonUrl})`);
    }

    // Public page — must have a non-empty <title>
    if (!/<title[^>]*>[^<]{3,}<\/title>/i.test(html)) {
      errors.push(`${rel}: missing or empty <title>`);
    }

    // Public page — must have a meta description of at least 10 chars
    if (!/<meta[^>]*name="description"[^>]*content="[^"]{10,}"/i.test(html)) {
      errors.push(`${rel}: missing <meta name="description"> (or content < 10 chars)`);
    }

    // Public page — must have og:url pointing at production host
    const ogUrlMatch = html.match(/<meta[^>]*property="og:url"[^>]*content="([^"]+)"/i);
    if (!ogUrlMatch) {
      errors.push(`${rel}: missing <meta property="og:url">`);
    } else if (!/^https:\/\/goldtickerlive\.com\//.test(ogUrlMatch[1])) {
      errors.push(`${rel}: og:url does not use https://goldtickerlive.com/ (got ${ogUrlMatch[1]})`);
    } else if (canonUrl && ogUrlMatch[1] !== canonUrl) {
      // og:url and canonical must agree — otherwise social shares and search engines
      // see two different "true" URLs for the page (Track 2.4 of the multi-track plan).
      errors.push(`${rel}: og:url (${ogUrlMatch[1]}) does not match canonical (${canonUrl})`);
    }

    // Redirect stubs don't require hreflang
    if (isRedirectStub(html)) continue;

    // Track title/description for the sitewide uniqueness gate below. Only full
    // public content pages (past the redirect-stub guard) participate.
    const title = titleOf(html);
    if (title) {
      if (!titleOwners.has(title)) titleOwners.set(title, []);
      titleOwners.get(title).push(rel);
    }
    const desc = descriptionOf(html);
    if (desc) {
      if (!descOwners.has(desc)) descOwners.set(desc, []);
      descOwners.get(desc).push(rel);
    }

    // Public page — must have hreflang en, ar, x-default
    const hreflangs = Array.from(html.matchAll(/hreflang="([^"]+)"/g)).map((m) => m[1]);
    const required = ['en', 'ar', 'x-default'];
    const missing = required.filter((r) => !hreflangs.includes(r));
    if (missing.length) {
      errors.push(
        `${rel}: missing hreflang=${missing.join(',')} (found: ${hreflangs.join(',') || 'none'})`
      );
    }
  }

  // Sitewide uniqueness: no two public content pages may share a <title> or a
  // meta description. Report every collision (each duplicate group once).
  for (const [title, owners] of titleOwners) {
    if (owners.length > 1) {
      errors.push(`duplicate <title> "${title}" on: ${owners.sort().join(', ')}`);
    }
  }
  for (const [desc, owners] of descOwners) {
    if (owners.length > 1) {
      errors.push(
        `duplicate <meta name="description"> "${desc.slice(0, 60)}…" on: ${owners.sort().join(', ')}`
      );
    }
  }

  if (errors.length) {
    console.error(
      `SEO meta check failed (${errors.length} issue${errors.length === 1 ? '' : 's'}):`
    );
    for (const e of errors.slice(0, 50)) console.error('  - ' + e);
    if (errors.length > 50) console.error(`  ... and ${errors.length - 50} more`);
    process.exit(1);
  }

  console.log(`SEO meta check passed (${files.length} HTML files scanned).`);
}

main();
