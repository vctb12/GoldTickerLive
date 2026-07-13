#!/usr/bin/env node
/**
 * css-coverage.mjs — Phase-2 dead-CSS coverage pass for the design revamp.
 *
 * For every rule in styles/**.css, decides whether its class selectors are used
 * anywhere in the shipped surface. A class counts as USED if its exact literal
 * appears in the HTML/JS corpus, or if a BEM stem of it does (to cover class
 * names built by string concatenation, e.g. `'gtl-dot--' + state`).
 *
 * "Corpus" = all committed .html (minus design mockups/plans), all JS/TS/MJS
 * source, and — with --with-dist — the built dist/ HTML (authoritative for
 * build-generated markup). Runtime-JS-added classes are covered by the JS source.
 *
 * A rule is a MOVE candidate (safe to quarantine) only if ALL of:
 *   - it is top-level (not nested inside @media/@supports),
 *   - every selector is class-only (no bare element / attribute / id / `*`),
 *   - every class token in every selector is unused.
 * Anything with dead classes that fails those gates is reported as REVIEW, never
 * auto-moved. Conservative by design: false "used" is fine, false "dead" is not.
 *
 * Usage:
 *   node scripts/design/css-coverage.mjs [--with-dist] [--json <path>]
 * Exit code is always 0 (report tool). Prints a markdown summary to stdout.
 */
import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const postcss = require('postcss');
let selectorParser = null;
try {
  selectorParser = require('postcss-selector-parser');
} catch {
  /* fall back to regex extraction below */
}

const ROOT = process.cwd();
const args = process.argv.slice(2);
const WITH_DIST = args.includes('--with-dist');
const jsonIdx = args.indexOf('--json');
const JSON_OUT = jsonIdx !== -1 ? args[jsonIdx + 1] : null;

const IGNORE_DIRS = new Set([
  'node_modules', '.git', 'playwright-report', 'test-results', 'coverage', 'styles', // styles = the CSS itself, not corpus
]);
const IGNORE_PREFIX = ['docs/design/reviews', 'docs/plans', 'dist/']; // dist handled separately

function walk(dir, exts, out = []) {
  for (const name of readdirSync(dir)) {
    if (IGNORE_DIRS.has(name)) continue;
    const p = join(dir, name);
    const rel = p.slice(ROOT.length + 1);
    if (IGNORE_PREFIX.some((ig) => rel.startsWith(ig))) continue;
    let st;
    try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) walk(p, exts, out);
    else if (exts.includes(extname(p))) out.push(p);
  }
  return out;
}

// ---- build corpus ----
const corpusFiles = walk(ROOT, ['.html', '.js', '.mjs', '.ts', '.jsx']);
if (WITH_DIST && existsSync(join(ROOT, 'dist'))) {
  const distHtml = [];
  (function w(d) {
    for (const n of readdirSync(d)) {
      const p = join(d, n);
      let st; try { st = statSync(p); } catch { continue; }
      if (st.isDirectory()) w(p);
      else if (extname(p) === '.html') distHtml.push(p);
    }
  })(join(ROOT, 'dist'));
  corpusFiles.push(...distHtml);
}
let corpus = '';
for (const f of corpusFiles) { try { corpus += '\n' + readFileSync(f, 'utf8'); } catch {} }
const corpusTokens = new Set(corpus.split(/[^A-Za-z0-9_-]+/));

function used(cls) {
  if (corpusTokens.has(cls)) return true;
  for (const sep of ['--', '__']) {
    const i = cls.lastIndexOf(sep);
    if (i > 0) {
      if (corpus.includes(cls.slice(0, i + sep.length))) return true; // stem with sep, e.g. "gtl-dot--"
      if (corpusTokens.has(cls.slice(0, i))) return true;
    }
  }
  // single-hyphen dynamic stem: `range-pill-group` -> try `range-pill-` then `range-`
  const parts = cls.split('-');
  for (let k = parts.length - 1; k >= 2; k--) {
    const stem = parts.slice(0, k).join('-') + '-';
    if (corpus.includes("'" + stem) || corpus.includes('`' + stem) || corpus.includes('"' + stem)) return true;
  }
  return false;
}

// ---- analyse a selector: extract classes + detect non-class simple selectors ----
function analyseSelector(sel) {
  const classes = new Set();
  let hasNonClass = false;
  if (selectorParser) {
    try {
      selectorParser((sels) => {
        sels.walk((node) => {
          if (node.type === 'class') classes.add(node.value);
          else if (node.type === 'tag' || node.type === 'attribute' || node.type === 'id' || node.type === 'universal') {
            hasNonClass = true;
          }
        });
      }).processSync(sel);
    } catch {
      // unparseable selector — be conservative: never treat as move-safe
      return { classes: [], hasNonClass: true };
    }
  } else {
    // regex fallback
    const cls = sel.match(/\.[A-Za-z_][A-Za-z0-9_-]*/g) || [];
    cls.forEach((c) => classes.add(c.slice(1)));
    // crude non-class detection: any bare tag/id/attr
    if (/(^|[\s>+~(])[a-zA-Z][\w-]*/.test(sel.replace(/\.[A-Za-z_][A-Za-z0-9_-]*/g, '').replace(/:[a-z-]+(\([^)]*\))?/gi, '')) ||
        /#[A-Za-z_]/.test(sel) || /\[[^\]]+\]/.test(sel) || /\*/.test(sel)) {
      hasNonClass = true;
    }
  }
  return { classes: [...classes], hasNonClass };
}

const cssFiles = walk(join(ROOT, 'styles'), ['.css']); // note: 'styles' is in IGNORE_DIRS for corpus; scan directly here
// walk() skipped styles because it's in IGNORE_DIRS; do a direct pass:
function walkCss(dir, out = []) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    let st; try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) walkCss(p, out);
    else if (extname(p) === '.css') out.push(p);
  }
  return out;
}
const files = walkCss(join(ROOT, 'styles')).sort();

const report = [];
for (const file of files) {
  const rel = file.slice(ROOT.length + 1);
  const css = readFileSync(file, 'utf8');
  let root;
  try { root = postcss.parse(css); } catch (e) { report.push({ file: rel, parseError: e.message }); continue; }

  let ruleCount = 0;
  const moveSafe = []; // {selector, classes}
  const review = []; // {selector, deadClasses, reason}

  root.each((node) => {
    if (node.type !== 'rule') return; // top-level rules only
    ruleCount++;
    // node.selectors: postcss splits on top-level commas only (safe for :is()/:not()).
    let sels;
    try { sels = node.selectors; } catch { sels = [node.selector]; }
    sels = (sels || []).map((s) => s.trim()).filter(Boolean);
    let allClassOnly = true;
    let anyClasses = false;
    const deadClasses = new Set();
    let anyLiveClass = false;
    for (const sel of sels) {
      const { classes, hasNonClass } = analyseSelector(sel);
      if (hasNonClass) allClassOnly = false;
      if (classes.length) anyClasses = true;
      for (const c of classes) {
        if (used(c)) anyLiveClass = true;
        else deadClasses.add(c);
      }
    }
    if (deadClasses.size === 0) return; // fully live
    if (allClassOnly && anyClasses && !anyLiveClass) {
      moveSafe.push({ selector: node.selector, classes: [...deadClasses] });
    } else {
      review.push({
        selector: node.selector,
        deadClasses: [...deadClasses],
        reason: !allClassOnly ? 'has-element/attr/id-selector' : anyLiveClass ? 'mixed-live-and-dead' : 'no-classes',
      });
    }
  });

  report.push({ file: rel, rules: ruleCount, moveSafe, review });
}

// ---- output ----
const totMove = report.reduce((s, r) => s + (r.moveSafe?.length || 0), 0);
const totReview = report.reduce((s, r) => s + (r.review?.length || 0), 0);
if (JSON_OUT) writeFileSync(JSON_OUT, JSON.stringify({ withDist: WITH_DIST, corpusFiles: corpusFiles.length, report }, null, 2));

console.log(`# CSS coverage — ${WITH_DIST ? 'WITH dist' : 'source-only'} (corpus: ${corpusFiles.length} files)`);
console.log(`Top-level MOVE-safe (class-only, fully dead) rules: **${totMove}**  ·  REVIEW rules (dead classes but not auto-movable): **${totReview}**\n`);
console.log('| File | move-safe rules | review rules |');
console.log('|---|--:|--:|');
for (const r of report.filter((r) => (r.moveSafe?.length || r.review?.length)).sort((a, b) => (b.moveSafe?.length || 0) - (a.moveSafe?.length || 0))) {
  console.log(`| ${r.file} | ${r.moveSafe?.length || 0} | ${r.review?.length || 0} |`);
}
