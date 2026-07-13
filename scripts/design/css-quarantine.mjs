#!/usr/bin/env node
/**
 * css-quarantine.mjs — Phase-2 mover. Relocates confirmed-dead, class-only,
 * top-level CSS rules from styles/**.css into styles/_graveyard/ (reversible;
 * the graveyard files are linked/imported by nothing, so they ship zero bytes).
 *
 * It RE-DERIVES move-safety with the exact same corpus as css-coverage.mjs
 * (source HTML/JS + dist/ HTML when present), then EXCLUDES any selector listed
 * in the --keep JSON (the adversarial workflow's KEEP verdicts). This double
 * gate — deterministic scan AND adversarial refutation — is the safety model.
 *
 * Usage:
 *   node scripts/design/css-quarantine.mjs --keep <keep.json> [--apply]
 * Without --apply it is a dry run. --keep is { "<file>": ["<selector>", ...] }.
 */
import { readFileSync, readdirSync, statSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const postcss = require('postcss');
let selectorParser = null;
try { selectorParser = require('postcss-selector-parser'); } catch {}

const ROOT = process.cwd();
const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const keepIdx = args.indexOf('--keep');
const KEEP = keepIdx !== -1 && existsSync(args[keepIdx + 1]) ? JSON.parse(readFileSync(args[keepIdx + 1], 'utf8')) : {};

const IGNORE_DIRS = new Set(['node_modules', '.git', 'playwright-report', 'test-results', 'coverage', 'styles']);
const IGNORE_PREFIX = ['docs/design/reviews', 'docs/plans', 'dist/'];
function walk(dir, exts, out = []) {
  for (const name of readdirSync(dir)) {
    if (IGNORE_DIRS.has(name)) continue;
    const p = join(dir, name); const rel = p.slice(ROOT.length + 1);
    if (IGNORE_PREFIX.some((ig) => rel.startsWith(ig))) continue;
    let st; try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) walk(p, exts, out); else if (exts.includes(extname(p))) out.push(p);
  }
  return out;
}
const corpusFiles = walk(ROOT, ['.html', '.js', '.mjs', '.ts', '.jsx']);
if (existsSync(join(ROOT, 'dist'))) {
  (function w(d) { for (const n of readdirSync(d)) { const p = join(d, n); let st; try { st = statSync(p); } catch { continue; } if (st.isDirectory()) w(p); else if (extname(p) === '.html') corpusFiles.push(p); } })(join(ROOT, 'dist'));
}
let corpus = ''; for (const f of corpusFiles) { try { corpus += '\n' + readFileSync(f, 'utf8'); } catch {} }
const corpusTokens = new Set(corpus.split(/[^A-Za-z0-9_-]+/));
function used(cls) {
  if (corpusTokens.has(cls)) return true;
  for (const sep of ['--', '__']) { const i = cls.lastIndexOf(sep); if (i > 0) { if (corpus.includes(cls.slice(0, i + sep.length))) return true; if (corpusTokens.has(cls.slice(0, i))) return true; } }
  const parts = cls.split('-');
  for (let k = parts.length - 1; k >= 2; k--) { const stem = parts.slice(0, k).join('-') + '-'; if (corpus.includes("'" + stem) || corpus.includes('`' + stem) || corpus.includes('"' + stem)) return true; }
  return false;
}
function analyseSelector(sel) {
  const classes = new Set(); let hasNonClass = false;
  if (selectorParser) {
    try { selectorParser((sels) => { sels.walk((n) => { if (n.type === 'class') classes.add(n.value); else if (['tag', 'attribute', 'id', 'universal'].includes(n.type)) hasNonClass = true; }); }).processSync(sel); }
    catch { return { classes: [], hasNonClass: true }; }
  } else { (sel.match(/\.[A-Za-z_][A-Za-z0-9_-]*/g) || []).forEach((c) => classes.add(c.slice(1))); if (/#[A-Za-z_]|\[[^\]]+\]|\*/.test(sel)) hasNonClass = true; }
  return { classes: [...classes], hasNonClass };
}

function walkCss(dir, out = []) { for (const n of readdirSync(dir)) { const p = join(dir, n); let st; try { st = statSync(p); } catch { continue; } if (st.isDirectory()) walkCss(p, out); else if (extname(p) === '.css') out.push(p); } return out; }
const GRAVEYARD = join(ROOT, 'styles', '_graveyard');
const files = walkCss(join(ROOT, 'styles')).filter((f) => !f.startsWith(GRAVEYARD)).sort();

let totalMoved = 0; const perFile = [];
for (const file of files) {
  const rel = file.slice(ROOT.length + 1);
  const keepSet = new Set(KEEP[rel] || []);
  const css = readFileSync(file, 'utf8');
  let root; try { root = postcss.parse(css); } catch { continue; }
  const toMove = [];
  root.each((node) => {
    if (node.type !== 'rule') return; // top-level only
    let sels; try { sels = node.selectors; } catch { sels = [node.selector]; }
    sels = (sels || []).map((s) => s.trim()).filter(Boolean);
    let allClassOnly = true, anyClasses = false, anyLive = false;
    for (const sel of sels) { const { classes, hasNonClass } = analyseSelector(sel); if (hasNonClass) allClassOnly = false; if (classes.length) anyClasses = true; for (const c of classes) if (used(c)) anyLive = true; }
    const moveSafe = allClassOnly && anyClasses && !anyLive;
    if (moveSafe && !keepSet.has(node.selector)) toMove.push(node);
  });
  if (!toMove.length) continue;
  perFile.push({ file: rel, moved: toMove.length, selectors: toMove.map((n) => n.selector) });
  totalMoved += toMove.length;
  if (APPLY) {
    const graveRoot = postcss.root();
    graveRoot.append(postcss.parse(`/* GRAVEYARD — dead rules quarantined from ${rel} (Phase 2, design revamp).\n   Reversible: paste a rule back into the source file if a regression surfaces.\n   Ships nothing: this file is imported/linked by nothing. Delete after one release cycle. */\n`));
    for (const node of toMove) { const clone = node.clone(); graveRoot.append(clone); node.remove(); }
    if (!existsSync(GRAVEYARD)) mkdirSync(GRAVEYARD, { recursive: true });
    const graveName = rel.replace(/^styles\//, '').replace(/\//g, '__');
    writeFileSync(join(GRAVEYARD, graveName), graveRoot.toString() + '\n');
    writeFileSync(file, root.toString());
  }
}

console.log(`${APPLY ? 'APPLIED' : 'DRY RUN'} — ${totalMoved} rules across ${perFile.length} files`);
for (const p of perFile.sort((a, b) => b.moved - a.moved)) console.log(`  ${p.file}: ${p.moved}`);
