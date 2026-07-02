#!/usr/bin/env node
/**
 * Phase 1 — HTML taxonomy report for the 20-phase cleanup program.
 * Reads page-inventory.json and emits reports/cleanup-audit/HTML_TAXONOMY.md.
 *
 * Usage: node scripts/node/generate-html-taxonomy.js [--inventory=reports/baseline-2026-07/page-inventory.json]
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const invArg = process.argv.find((a) => a.startsWith('--inventory='))?.slice(12);
const INVENTORY = path.join(ROOT, invArg || 'reports/baseline-2026-07/page-inventory.json');
const OUT = path.join(ROOT, 'reports/cleanup-audit/HTML_TAXONOMY.md');

function classify(relPath, _htmlSnippet = '') {
  if (relPath.startsWith('admin/')) return 'admin';
  if (relPath.startsWith('ar/')) return 'ar-mirror';
  if (
    ['config/', 'data/', 'docs/', 'scripts/', 'server/', 'src/', 'styles/', 'supabase/'].some((p) =>
      relPath.startsWith(p)
    )
  ) {
    return 'phantom';
  }
  if (relPath.startsWith('countries/')) {
    if (/\/gold-rate\/index\.html$/.test(relPath)) return 'indexable';
    if (/\/gold-shops\/index\.html$/.test(relPath)) return 'indexable';
    if (/^countries\/[^/]+\/[^/]+\/index\.html$/.test(relPath)) return 'noindex-nav';
    return 'indexable';
  }
  if (relPath.startsWith('gold-price/') || relPath.startsWith('ar/gold-price/')) {
    return 'deprecated-candidate';
  }
  if (relPath.startsWith('content/')) return 'indexable';
  return 'indexable';
}

function isNoindex(relPath) {
  try {
    const html = fs.readFileSync(path.join(ROOT, relPath), 'utf8');
    return /<meta[^>]+name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html);
  } catch {
    return false;
  }
}

function main() {
  if (!fs.existsSync(INVENTORY)) {
    console.error(`Missing inventory: ${INVENTORY}. Run generate-baseline-inventory.js first.`);
    process.exit(1);
  }
  const inv = JSON.parse(fs.readFileSync(INVENTORY, 'utf8'));
  const buckets = {
    indexable: [],
    'noindex-nav': [],
    phantom: [],
    admin: [],
    'ar-mirror': [],
    'deprecated-candidate': [],
  };

  for (const rec of inv.records || []) {
    const tag = classify(rec.path);
    buckets[tag].push(rec);
  }

  const deprecated = buckets['deprecated-candidate'].filter((r) => !isNoindex(r.path));

  const lines = [
    '# HTML taxonomy — Phase 1 (read-only)',
    '',
    `> Generated: ${new Date().toISOString()}`,
    `> Source: \`${path.relative(ROOT, INVENTORY)}\``,
    '> Plan: [2026-07-01_20-phase-design-functionality-page-cleanup-revamp.md](../../docs/plans/2026-07-01_20-phase-design-functionality-page-cleanup-revamp.md)',
    '',
    '**No deletions in this report.** Deprecated candidates require owner sign-off.',
    '',
    '## Summary',
    '',
    '| Tag | Count |',
    '| --- | ----: |',
    ...Object.entries(buckets).map(([k, v]) => `| \`${k}\` | ${v.length} |`),
    '',
    '## Deprecated candidates (indexable today — Phase 4 review)',
    '',
    deprecated.length
      ? deprecated.map(
          (r) => `- \`${r.path}\` — inbound: ${r.inboundLinkCount}, sitemap: ${r.inSitemap}`
        )
      : ['_None flagged._'],
    '',
    '## Zero-inbound indexable content (Phase 5)',
    '',
  ];

  const orphans = (buckets.indexable || []).filter(
    (r) => r.path.startsWith('content/') && (r.inboundLinkCount || 0) === 0 && !isNoindex(r.path)
  );
  lines.push(
    orphans.length
      ? orphans.map((r) => `- \`${r.path}\``)
      : ['_None — all content pages have ≥1 inbound link._']
  );
  lines.push('');

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, lines.join('\n'));
  console.log(`✅ HTML_TAXONOMY.md written (${inv.records?.length || 0} pages)`);
}

main();
