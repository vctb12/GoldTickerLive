#!/usr/bin/env node
/**
 * scripts/node/generate-lighthouse-summary.js
 *
 * Reads all Lighthouse JSON reports under reports/baseline-2026-05/lighthouse/
 * and produces a human-readable markdown summary + updated summary JSON.
 *
 * Usage: node scripts/node/generate-lighthouse-summary.js
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const LH_DIR = path.join(ROOT, 'reports', 'baseline-2026-05', 'lighthouse');
const SUMMARY_MD = path.join(ROOT, 'reports', 'baseline-2026-05', 'lighthouse-summary.md');

if (!fs.existsSync(LH_DIR)) {
  console.error(`Lighthouse directory not found: ${LH_DIR}`);
  process.exit(1);
}

const files = fs.readdirSync(LH_DIR).filter((f) => f.endsWith('.json') && !f.startsWith('summary'));
const rows = [];

for (const file of files.sort()) {
  const filePath = path.join(LH_DIR, file);
  let data;
  try {
    data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    rows.push({ file, error: 'parse error' });
    continue;
  }

  const cats = data.categories || {};
  const scores = {
    performance: cats.performance?.score != null ? Math.round(cats.performance.score * 100) : null,
    accessibility:
      cats.accessibility?.score != null ? Math.round(cats.accessibility.score * 100) : null,
    seo: cats.seo?.score != null ? Math.round(cats.seo.score * 100) : null,
    bestPractices:
      cats['best-practices']?.score != null ? Math.round(cats['best-practices'].score * 100) : null,
  };

  const lcp = data.audits?.['largest-contentful-paint']?.displayValue ?? 'n/a';
  const cls = data.audits?.['cumulative-layout-shift']?.displayValue ?? 'n/a';
  const tbt = data.audits?.['total-blocking-time']?.displayValue ?? 'n/a';
  const fcp = data.audits?.['first-contentful-paint']?.displayValue ?? 'n/a';

  // Parse slug-formfactor-locale from filename
  const m = file.match(/^(.+)-(mobile|desktop)-(en|ar)\.json$/);
  const [, slug, ff, locale] = m || ['', file, '', ''];

  rows.push({ file, slug, formFactor: ff, locale, scores, lcp, cls, tbt, fcp });
}

// ─── Markdown table ─────────────────────────────────────────────────────────

const lines = [
  '# Phase 0 — Lighthouse Baseline Summary',
  '',
  `Generated: ${new Date().toISOString()}`,
  '',
  '> ⚠️ **Budget thresholds (Phase 0 baseline):** LCP < 2.5 s · CLS < 0.05 · TBT < 200 ms',
  '> Performance regressions in subsequent phases are measured against this table.',
  '',
  '| Page | Form Factor | Locale | Perf | A11y | SEO | LCP | CLS | TBT |',
  '|------|-------------|--------|------|------|-----|-----|-----|-----|',
];

for (const row of rows) {
  if (row.error) {
    lines.push(`| ${row.file} | — | — | parse error | — | — | — | — | — |`);
    continue;
  }
  const s = row.scores;
  const fmt = (v) => (v == null ? '—' : String(v));
  const perfCell =
    s.performance == null
      ? '—'
      : s.performance < 50
        ? `🔴 ${s.performance}`
        : s.performance < 90
          ? `🟡 ${s.performance}`
          : `🟢 ${s.performance}`;
  lines.push(
    `| ${row.slug} | ${row.formFactor} | ${row.locale} | ${perfCell} | ${fmt(s.accessibility)} | ${fmt(s.seo)} | ${row.lcp} | ${row.cls} | ${row.tbt} |`
  );
}

lines.push(
  '',
  '## Notes',
  '',
  '- Scores are from local `dist/` build (sandbox environment — Chrome cannot reach live URLs).',
  '- Re-run via the `Phase 0 — Lighthouse Baseline Capture` workflow against the live site for production-accurate baselines.',
  ''
);

fs.writeFileSync(SUMMARY_MD, lines.join('\n'));
console.log(`✅ Lighthouse summary written → ${path.relative(ROOT, SUMMARY_MD)}`);
console.log(`   ${rows.filter((r) => !r.error).length} reports processed`);
