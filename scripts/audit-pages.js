#!/usr/bin/env node
/**
 * scripts/audit-pages.js
 * Validates that every public HTML file has required metadata:
 *   - <title> (non-empty)
 *   - meta name="description"
 *   - link rel="canonical"
 *   - meta property="og:image"
 *
 * Usage:  node scripts/audit-pages.js [--fail-on-error]
 * Exit 0 = all pages pass.
 * Exit 1 = issues found (when --fail-on-error is set).
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT       = path.resolve(__dirname, '..');
const FAIL       = process.argv.includes('--fail-on-error');

const SKIP_DIRS  = new Set(['dist', 'node_modules', '.git', 'server', 'tests', 'docs', 'supabase', 'repositories', 'build', 'scripts']);
const SKIP_FILES = new Set(['admin.html', 'offline.html']);

function walkHtml(dir, results = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || SKIP_DIRS.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walkHtml(full, results);
    else if (e.name.endsWith('.html') && !SKIP_FILES.has(e.name)) results.push(full);
  }
  return results;
}

const CHECKS = [
  { name: 'title',       re: /<title[^>]*>([^<]{3,})<\/title>/i },
  { name: 'description', re: /<meta\s[^>]*name=["']description["'][^>]*content=["'][^"']{10,}/i },
  { name: 'canonical',   re: /<link\s[^>]*rel=["']canonical["']/i },
  { name: 'og:image',    re: /<meta\s[^>]*property=["']og:image["']/i },
];

const htmlFiles = walkHtml(ROOT);
let totalIssues = 0;
const report = [];

for (const file of htmlFiles) {
  const html   = fs.readFileSync(file, 'utf8');
  const relFile = path.relative(ROOT, file);
  const issues  = [];

  for (const { name, re } of CHECKS) {
    if (!re.test(html)) {
      issues.push(name);
    }
  }

  if (issues.length) {
    report.push({ file: relFile, issues });
    totalIssues += issues.length;
  }
}

if (totalIssues === 0) {
  console.log(`✅  audit-pages: all ${htmlFiles.length} HTML pages pass metadata checks.`);
  process.exit(0);
} else {
  console.error(`⚠️  audit-pages: ${totalIssues} metadata issue(s) across ${report.length} page(s):\n`);
  for (const { file, issues } of report) {
    console.error(`📄  ${file}`);
    for (const issue of issues) {
      console.error(`    ✗ missing: ${issue}`);
    }
  }
  console.error('');
  if (FAIL) process.exit(1);
  else process.exit(0);
}
