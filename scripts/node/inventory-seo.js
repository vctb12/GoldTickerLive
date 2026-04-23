#!/usr/bin/env node
/**
 * scripts/node/inventory-seo.js
 *
 * Read-only SEO-surface inventory. Walks every public HTML file and emits a
 * deterministic JSON artefact at `reports/seo/inventory.json` capturing
 * canonical, og:*, twitter:*, hreflang, and JSON-LD @type per file. The
 * committed artefact makes SEO-surface drift visible as a PR diff.
 *
 * Complements (does not replace) `scripts/node/check-seo-meta.js`, which
 * gates presence. This script records values.
 *
 * Usage:
 *   node scripts/node/inventory-seo.js           # regenerate
 *   node scripts/node/inventory-seo.js --check   # exit 1 if committed file is stale
 *   node scripts/node/inventory-seo.js --stdout  # print JSON, don't write
 *
 * Charter refs: AGENTS.md §6.4 (SEO surface integrity), §6.11 (honest
 * verification — this script records truth, never rewrites any SEO surface).
 *
 * See docs/plans/2026-04-23_seo-surface-inventory.md for the full proposal.
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const OUTPUT_REL = path.join('reports', 'seo', 'inventory.json');
const OUTPUT_ABS = path.join(ROOT, OUTPUT_REL);

const CHECK_ONLY = process.argv.includes('--check');
const STDOUT_ONLY = process.argv.includes('--stdout');

// Match the exclusion set used by scripts/node/check-seo-meta.js so the
// inventory and the gate disagree about zero files.
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
  'content/embed/',
  'reports/',
  '.git/',
];

// Pages that are intentionally exempt from canonical/hreflang in the gate.
// We still record them in the inventory (with null fields) so they're visible.
const EXEMPT_FILES = new Set(['404.html', 'offline.html']);

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(ROOT, full).split(path.sep).join('/');
    if (entry.isDirectory()) {
      if (INTERNAL_PREFIXES.some((p) => rel === p.slice(0, -1) || rel.startsWith(p))) continue;
      walk(full, acc);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      acc.push(rel);
    }
  }
  return acc;
}

// -- tiny targeted parsers ---------------------------------------------------
// Rationale (per plan §6): stay dependency-neutral in v1. The parsers are
// intentionally narrow: they only recognize tags we need. Unit tests lock
// the detection surface.

function firstMatch(html, re) {
  const m = html.match(re);
  return m ? m[1] : null;
}

function decode(str) {
  if (str == null) return null;
  // Only decode the five HTML entities likely to appear in SEO attributes.
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function attr(name) {
  // Matches `name="value"` allowing either attribute order.
  return new RegExp(`${name}\\s*=\\s*"([^"]*)"`, 'i');
}

function extractHtmlLangDir(html) {
  const htmlTag = html.match(/<html\b[^>]*>/i);
  if (!htmlTag) return { lang: null, dir: null };
  return {
    lang: decode(firstMatch(htmlTag[0], attr('lang'))),
    dir: decode(firstMatch(htmlTag[0], attr('dir'))),
  };
}

function extractTitle(html) {
  const m = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  if (!m) return null;
  const text = m[1].replace(/\s+/g, ' ').trim();
  return text.length ? decode(text) : null;
}

function extractMetaByName(html, name) {
  // Handle both orders: name=...content=... and content=...name=...
  const tag = html.match(new RegExp(`<meta\\b[^>]*\\bname\\s*=\\s*"${name}"[^>]*>`, 'i'));
  if (!tag) return null;
  return decode(firstMatch(tag[0], attr('content')));
}

function extractMetaByProperty(html, prop) {
  const tag = html.match(
    new RegExp(`<meta\\b[^>]*\\bproperty\\s*=\\s*"${prop.replace(':', '\\:')}"[^>]*>`, 'i')
  );
  if (!tag) return null;
  return decode(firstMatch(tag[0], attr('content')));
}

function extractCanonical(html) {
  const tag = html.match(/<link\b[^>]*\brel\s*=\s*"canonical"[^>]*>/i);
  if (!tag) return null;
  return decode(firstMatch(tag[0], attr('href')));
}

function extractHreflang(html) {
  const pairs = [];
  const tagRe = /<link\b[^>]*\brel\s*=\s*"alternate"[^>]*>/gi;
  let m;
  while ((m = tagRe.exec(html)) !== null) {
    const lang = decode(firstMatch(m[0], attr('hreflang')));
    const href = decode(firstMatch(m[0], attr('href')));
    if (lang) pairs.push({ lang, href: href || null });
  }
  pairs.sort((a, b) => a.lang.localeCompare(b.lang));
  return pairs;
}

// Collects top-level @type values from every JSON-LD block. Arrays of @type
// and @graph arrays-of-objects are both flattened. Invalid JSON is tallied
// as a parse failure instead of throwing.
function extractJsonLdTypes(html) {
  const types = new Set();
  let parseFailures = 0;
  const re = /<script\b[^>]*type\s*=\s*"application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const body = m[1].trim();
    if (!body) continue;
    let parsed;
    try {
      parsed = JSON.parse(body);
    } catch {
      parseFailures += 1;
      continue;
    }
    const visit = (node) => {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) {
        for (const item of node) visit(item);
        return;
      }
      const t = node['@type'];
      if (typeof t === 'string') types.add(t);
      else if (Array.isArray(t)) for (const v of t) if (typeof v === 'string') types.add(v);
      if (Array.isArray(node['@graph'])) for (const item of node['@graph']) visit(item);
    };
    visit(parsed);
  }
  return { types: Array.from(types).sort(), parseFailures };
}

function recordFor(rel) {
  const html = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const { lang, dir } = extractHtmlLangDir(html);
  const canonical = extractCanonical(html);
  const robots = extractMetaByName(html, 'robots');
  const jsonLd = extractJsonLdTypes(html);

  return {
    path: rel,
    exempt: EXEMPT_FILES.has(rel) || null,
    lang,
    dir,
    title: extractTitle(html),
    metaDescription: extractMetaByName(html, 'description'),
    canonical,
    robots,
    ogTitle: extractMetaByProperty(html, 'og:title'),
    ogDescription: extractMetaByProperty(html, 'og:description'),
    ogImage: extractMetaByProperty(html, 'og:image'),
    ogUrl: extractMetaByProperty(html, 'og:url'),
    ogType: extractMetaByProperty(html, 'og:type'),
    twitterCard: extractMetaByName(html, 'twitter:card'),
    twitterImage: extractMetaByName(html, 'twitter:image'),
    hreflang: extractHreflang(html),
    jsonLdTypes: jsonLd.types,
    hasStructuredData: jsonLd.types.length > 0,
    jsonLdParseFailures: jsonLd.parseFailures || null,
  };
}

function summarize(records) {
  let withCanonical = 0;
  let withOgImage = 0;
  let withJsonLd = 0;
  let hreflangPairs = 0;
  let noindexCount = 0;
  for (const r of records) {
    if (r.canonical) withCanonical += 1;
    if (r.ogImage) withOgImage += 1;
    if (r.hasStructuredData) withJsonLd += 1;
    const langs = new Set(r.hreflang.map((h) => h.lang));
    if (langs.has('en') && langs.has('ar')) hreflangPairs += 1;
    if (r.robots && /noindex/i.test(r.robots)) noindexCount += 1;
  }
  return {
    totalHtmlFiles: records.length,
    withCanonical,
    withoutCanonical: records.length - withCanonical,
    withOgImage,
    withoutOgImage: records.length - withOgImage,
    withJsonLd,
    withoutJsonLd: records.length - withJsonLd,
    hreflangEnArPairs: hreflangPairs,
    noindexCount,
  };
}

function buildReport() {
  const files = walk(ROOT).sort();
  const records = files.map(recordFor);
  return {
    schemaVersion: 1,
    generatedAtDate: new Date().toISOString().slice(0, 10),
    summary: summarize(records),
    records,
  };
}

function stringify(report) {
  // Two-space indent + trailing newline for diff stability.
  return JSON.stringify(report, null, 2) + '\n';
}

function main() {
  const report = buildReport();
  const text = stringify(report);

  if (STDOUT_ONLY) {
    process.stdout.write(text);
    return;
  }

  if (CHECK_ONLY) {
    if (!fs.existsSync(OUTPUT_ABS)) {
      console.error(
        `[inventory-seo:check] ${OUTPUT_REL} is missing. Run \`node scripts/node/inventory-seo.js\`.`
      );
      process.exit(1);
    }
    const existing = fs.readFileSync(OUTPUT_ABS, 'utf8');
    // Ignore `generatedAtDate` line when comparing — it's the only expected
    // day-to-day churn.
    const normalize = (s) => s.replace(/"generatedAtDate":\s*"[^"]*"/, '"generatedAtDate":"_"');
    if (normalize(existing) !== normalize(text)) {
      console.error(
        `[inventory-seo:check] ${OUTPUT_REL} is stale. Run \`node scripts/node/inventory-seo.js\` and commit.`
      );
      process.exit(1);
    }
    console.log(
      `[inventory-seo:check] OK (${report.records.length} files, ${report.summary.withCanonical} with canonical, ${report.summary.withJsonLd} with JSON-LD)`
    );
    return;
  }

  fs.mkdirSync(path.dirname(OUTPUT_ABS), { recursive: true });
  fs.writeFileSync(OUTPUT_ABS, text);
  console.log(
    `[inventory-seo] wrote ${OUTPUT_REL} (${report.records.length} files, ${report.summary.withCanonical} canonical / ${report.summary.withOgImage} og:image / ${report.summary.withJsonLd} JSON-LD)`
  );
}

// Export pure helpers for unit tests.
module.exports = {
  extractHtmlLangDir,
  extractTitle,
  extractMetaByName,
  extractMetaByProperty,
  extractCanonical,
  extractHreflang,
  extractJsonLdTypes,
  recordFor,
  summarize,
  buildReport,
};

if (require.main === module) main();
