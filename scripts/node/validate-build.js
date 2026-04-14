#!/usr/bin/env node

/**
 * scripts/validate-build.js
 *
 * Pre-build validation that catches common issues before Vite runs.
 * Run via: node scripts/validate-build.js  (or npm run validate)
 *
 * Checks:
 *   1. Required static files exist (sw.js, robots.txt, etc.)
 *   2. No `await` inside non-async functions in HTML inline scripts
 *   3. Critical JS module imports resolve to existing files
 *
 * Exit code 0 = all checks pass, 1 = issues found.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
let errors = 0;
let warnings = 0;

function error(msg) {
  console.error(`  \u274C  ${msg}`);
  errors++;
}

function warn(msg) {
  console.warn(`  \u26A0\uFE0F  ${msg}`);
  warnings++;
}

function ok(msg) {
  console.log(`  \u2705  ${msg}`);
}

// ── 1. Check required static files ──────────────────────────────────────────

console.log('\n\uD83D\uDD0D Checking required static files\u2026');
const REQUIRED_FILES = [
  'index.html',
  'sw.js',
  'robots.txt',
  'styles/global.css',
  'favicon.svg',
  'manifest.json',
  'vite.config.js',
  'package.json',
];
let requiredOk = true;
for (const f of REQUIRED_FILES) {
  if (!fs.existsSync(path.join(ROOT, f))) {
    error(`Missing required file: ${f}`);
    requiredOk = false;
  }
}
if (requiredOk) ok('All required static files present');

// ── 2. Check for await-in-non-async in HTML inline scripts ──────────────────

console.log('\n\uD83D\uDD0D Checking HTML inline scripts for await-in-non-async\u2026');

function checkHtmlFile(filePath) {
  const html = fs.readFileSync(filePath, 'utf8');
  const scriptRe = /<script\s+type=["']module["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  let fileOk = true;

  while ((match = scriptRe.exec(html)) !== null) {
    const script = match[1];
    const scriptOffset = match.index + match[0].indexOf(match[1]);

    // Find non-async function declarations
    const funcRe = /\b(async\s+)?function\s+(\w+)\s*\([^)]*\)\s*\{/g;
    let fm;
    while ((fm = funcRe.exec(script)) !== null) {
      if (fm[1]) continue; // async — skip

      const funcName = fm[2];
      const bodyStart = fm.index + fm[0].length;

      // Walk brace-matched body, tracking which braces open an async context
      let depth = 1;
      let i = bodyStart;
      // Stack tracks whether each brace depth level is an async context
      const asyncAtDepth = new Set();

      while (i < script.length && depth > 0) {
        const rest = script.slice(i);

        // Detect start of async context: `async function`, `async (`, `async id =>`
        if (/^async\s+(function\b|\()/.test(rest)) {
          // The next opening brace will be an async context
          // Find it by scanning forward
          const braceIdx = script.indexOf('{', i + 5);
          if (braceIdx !== -1) {
            // Mark this upcoming depth as async when we encounter the brace
            asyncAtDepth.add(depth + 1);
          }
        }

        if (script[i] === '{') {
          depth++;
        } else if (script[i] === '}') {
          asyncAtDepth.delete(depth);
          depth--;
          if (depth === 0) break;
        }

        // Check for bare await — only flag if we're not inside any nested async
        const inAsyncContext = [...asyncAtDepth].some((d) => d <= depth);
        if (!inAsyncContext && /^await\s/.test(rest)) {
          const beforeInHtml = html.slice(0, scriptOffset + i);
          const lineNo = beforeInHtml.split('\n').length;
          const snippet = script
            .slice(i, i + 50)
            .replace(/\n/g, ' ')
            .trim();
          error(
            `${path.relative(ROOT, filePath)}:${lineNo} \u2014 'await' in non-async function ${funcName}(): "${snippet}\u2026"`
          );
          fileOk = false;
        }

        i++;
      }
    }
  }
  return fileOk;
}

// Read EXCLUDE_DIRS from vite.config.js
const viteConfig = fs.readFileSync(path.join(ROOT, 'vite.config.js'), 'utf8');
const excludeMatch = viteConfig.match(/EXCLUDE_DIRS\s*=\s*\[([\s\S]*?)\]/);
const excludeDirs = excludeMatch
  ? [...excludeMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1])
  : [];
const SKIP = new Set([
  ...excludeDirs,
  'dist',
  'node_modules',
  '.git',
  '.github',
  'scripts',
  'tests',
  'repositories',
  'supabase',
  'docs',
  'public',
]);

function walkHtml(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir)) {
    if (entry.startsWith('.')) continue;
    const full = path.join(dir, entry);
    const topDir = full.slice(ROOT.length + 1).split(path.sep)[0];
    if (SKIP.has(topDir)) continue;

    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      results.push(...walkHtml(full));
    } else if (entry.endsWith('.html')) {
      results.push(full);
    }
  }
  return results;
}

const htmlFiles = walkHtml(ROOT);
let htmlIssues = 0;
for (const f of htmlFiles) {
  if (!checkHtmlFile(f)) htmlIssues++;
}
if (htmlIssues === 0)
  ok(`Checked ${htmlFiles.length} HTML files \u2014 no await-in-non-async issues`);

// ── 3. Check that critical JS imports resolve ───────────────────────────────

console.log('\n\uD83D\uDD0D Checking critical JS module imports\u2026');

let importIssues = 0;

function checkImports(jsFile) {
  const content = fs.readFileSync(jsFile, 'utf8');
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    // Skip comment lines
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) continue;
    const im = trimmed.match(/(?:import|export)\s+.*?from\s+['"]([^'"]+)['"]/);
    if (!im) continue;
    const spec = im[1];
    if (!spec.startsWith('.') && !spec.startsWith('/')) continue;
    const resolved = path.resolve(path.dirname(jsFile), spec);
    if (
      !fs.existsSync(resolved) &&
      !fs.existsSync(resolved + '.js') &&
      !fs.existsSync(path.join(resolved, 'index.js'))
    ) {
      const rel = path.relative(ROOT, jsFile);
      error(`${rel}: import '${spec}' does not resolve to an existing file`);
      importIssues++;
    }
  }
}

const CRITICAL_DIRS = ['src/pages', 'src/lib', 'src/config', 'src/components', 'src/tracker'];
for (const d of CRITICAL_DIRS) {
  const dirPath = path.join(ROOT, d);
  if (!fs.existsSync(dirPath)) continue;
  for (const entry of fs.readdirSync(dirPath)) {
    if (entry.endsWith('.js')) {
      checkImports(path.join(dirPath, entry));
    }
  }
}
if (importIssues === 0) ok('All critical JS imports resolve');

// ── Summary ─────────────────────────────────────────────────────────────────

console.log('\n' + '\u2500'.repeat(60));
if (errors > 0) {
  console.error(`\n\uD83D\uDCA5 Validation failed: ${errors} error(s), ${warnings} warning(s)\n`);
  process.exit(1);
} else {
  console.log(`\n\u2705 Validation passed: 0 errors, ${warnings} warning(s)\n`);
  process.exit(0);
}
