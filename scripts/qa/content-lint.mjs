#!/usr/bin/env node
/**
 * content-lint.mjs — content-quality lint for the site's authored HTML pages.
 *
 * Catches the small content defects that slip past HTML/JS validation but hurt trust and polish:
 *   · leftover placeholder / TODO / lorem markers (visible text OR comments)
 *   · doubled words ("the the")
 *   · unbalanced bilingual `data-lang-block` counts (EN blocks ≠ AR blocks on a page)
 *   · broken same-page `href="#id"` anchors (no matching element id)
 *   · empty headings (`<h2></h2>`)
 *
 * Reports findings grouped by severity. `--check` exits 1 when any ERROR-level finding is present
 * (WARN-level findings — e.g. placeholder comments awaiting an owner decision — never fail the run
 * unless `--strict` is also passed).
 *
 * Security: operates on a fixed in-repo allowlist of page paths — no external input reaches `fs`.
 */
import { readFileSync, existsSync } from 'node:fs';

const CHECK = process.argv.includes('--check');
const STRICT = process.argv.includes('--strict');

// Authored top-level pages. Interactive shells whose body is JS-rendered are still linted for the
// static shell content that ships in the HTML.
const PAGES = [
  'index.html', 'learn.html', 'glossary.html', 'methodology.html', 'calculator.html',
  'tracker.html', 'compare.html', 'heatmap.html', 'portfolio.html', 'shops.html',
  'dubai-gold-price.html', 'invest.html', 'privacy.html', 'terms.html', 'not-found.html',
];

const PLACEHOLDER_RE = /\b(lorem ipsum|TODO|FIXME|XXX+|TBD|coming soon|PLACEHOLDER|REPLACE[_ ]WITH)\b/i;
const DOUBLED_RE = /\b(the|a|an|of|to|and|is|in|for|on|with|that|it)\s+\1\b/gi;

function stripAttrsAndTags(html) {
  // Crude text extraction: drop scripts/styles, tags → space; comments handled separately.
  // Closing tags use `</tag[^>]*>` so they also match `</script >` / `</style\n>` (CodeQL
  // bad-HTML-filtering-regexp). This is dev-time text extraction over trusted repo files, not a
  // security sanitiser, but the robust form is correct regardless.
  return html
    .replace(/<script\b[\s\S]*?<\/script[^>]*>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style[^>]*>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ');
}

function lintPage(path) {
  const html = readFileSync(path, 'utf8');
  const findings = [];
  const add = (sev, msg) => findings.push({ sev, msg });

  // Placeholders — in comments (WARN, may await owner content) and in visible text (ERROR).
  for (const m of html.matchAll(/<!--([\s\S]*?)-->/g)) {
    if (PLACEHOLDER_RE.test(m[1])) add('WARN', `placeholder marker in comment: "${m[1].trim().slice(0, 70)}"`);
  }
  const text = stripAttrsAndTags(html).replace(/&[a-z]+;/gi, ' ');
  const vis = text.match(PLACEHOLDER_RE);
  if (vis) add('ERROR', `placeholder marker in visible text: "${vis[0]}"`);

  // Doubled words in visible text.
  const doubled = [...text.matchAll(DOUBLED_RE)].map((m) => m[0].replace(/\s+/g, ' '));
  for (const d of [...new Set(doubled)]) add('ERROR', `doubled word: "${d}"`);

  // Bilingual block balance.
  const en = (html.match(/data-lang-block=["']en["']/g) || []).length;
  const ar = (html.match(/data-lang-block=["']ar["']/g) || []).length;
  if (en !== ar) add('ERROR', `unbalanced bilingual blocks: ${en} EN vs ${ar} AR`);

  // Broken same-page anchors — only real <a> navigation links, NOT SVG <use href="#i-..."> sprite
  // references (whose symbols live in an injected sprite, not this file).
  const ids = new Set([...html.matchAll(/\bid=["']([^"']+)["']/g)].map((m) => m[1]));
  const SPECIAL = new Set(['main-content', '']);
  for (const m of html.matchAll(/<a\b[^>]*\bhref=["']#([a-z0-9_-]+)["']/gi)) {
    const target = m[1];
    if (!ids.has(target) && !SPECIAL.has(target)) add('ERROR', `broken same-page anchor: #${target}`);
  }

  // Empty headings — an ERROR only when there is NO runtime-population binding. Headings that ship
  // empty but carry `data-i18n` / `id` / a `data-*` hook are filled by i18n/JS on load (a common,
  // intentional pattern here), so they are not flagged.
  for (const m of html.matchAll(/<(h[1-6])\b([^>]*)>\s*<\/\1>/gi)) {
    const bound = /\b(data-i18n[a-z-]*|id|data-[a-z-]+)=/.test(m[2]);
    if (!bound) add('ERROR', `empty ${m[1]} element with no population binding`);
  }

  return findings;
}

let errors = 0;
let warns = 0;
const lines = [];
for (const page of PAGES) {
  if (!existsSync(page)) continue;
  const findings = lintPage(page);
  if (!findings.length) continue;
  lines.push(`\n${page}`);
  for (const f of findings) {
    lines.push(`  ${f.sev === 'ERROR' ? '✖' : '⚠'} [${f.sev}] ${f.msg}`);
    if (f.sev === 'ERROR') errors++;
    else warns++;
  }
}

console.log(lines.length ? lines.join('\n').trim() : 'content-lint: no findings.');
console.log(`\ncontent-lint: ${errors} error(s), ${warns} warning(s) across ${PAGES.length} pages.`);

if (CHECK && (errors > 0 || (STRICT && warns > 0))) process.exit(1);
