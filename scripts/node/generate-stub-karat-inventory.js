#!/usr/bin/env node
/**
 * Phase 4 — Stub karat / thin page inventory (report-only, no deletions).
 * Outputs reports/cleanup-audit/STUB_KARAT_INVENTORY.md
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const OUT = path.join(ROOT, 'reports/cleanup-audit/STUB_KARAT_INVENTORY.md');
const PATTERNS = [/^gold-price\//, /^ar\/gold-price\//];

function walkHtml(dir, base = '', out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || ['node_modules', 'dist', '.git'].includes(entry.name))
      continue;
    const rel = base ? `${base}/${entry.name}` : entry.name;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) walkHtml(abs, rel, out);
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(rel);
  }
  return out;
}

function meta(rel) {
  const html = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const canonical =
    html.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1] || '';
  const noindex = /<meta[^>]+name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html);
  return { canonical, noindex };
}

function main() {
  const all = walkHtml(ROOT);
  const stubs = all.filter((p) => PATTERNS.some((re) => re.test(p)));

  const lines = [
    '# Stub karat page inventory — Phase 4 (report-only)',
    '',
    `> Generated: ${new Date().toISOString()}`,
    '> **Owner sign-off required** before noindex or 301. Align with NEXT_PR_SEQUENCE PR 2.',
    '',
    '| Path | noindex | Canonical | Proposed action |',
    '| --- | --- | --- | --- |',
  ];

  for (const rel of stubs.sort()) {
    const { canonical, noindex } = meta(rel);
    const karat = rel.match(/(\d+k)/i)?.[1]?.toUpperCase() || '?';
    const proposed = noindex
      ? 'Already noindex — verify canonical'
      : `Consider noindex + canonical to tracker.html#mode=live&k=${karat.replace('K', '')}`;
    lines.push(`| \`${rel}\` | ${noindex ? 'yes' : 'no'} | ${canonical || '—'} | ${proposed} |`);
  }

  lines.push('', `**Total:** ${stubs.length} stub paths.`, '');
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, lines.join('\n'));
  console.log(`✅ STUB_KARAT_INVENTORY.md written (${stubs.length} pages)`);
}

main();
