#!/usr/bin/env node
/**
 * Regression guard: no bare-relative `href:` literals in safe-DOM attribute objects.
 *
 * Why this exists
 * ---------------
 * `el()` (src/lib/safe-dom.js) routes every URL attribute through `safeHref()`,
 * whose allowlist is: absolute http(s), `mailto:`, `tel:`, root-relative (`/…`),
 * explicitly-relative (`./…`, `../…`) and fragments (`#…`). A *bare*-relative URL
 * such as `tracker.html` matches none of those, so `safeHref()` returns `''` — and
 * `el()` then skips `setAttribute` entirely:
 *
 *     const safeValue = safeHref(String(value), keyLower);
 *     if (safeValue) node.setAttribute(key, safeValue);
 *
 * The result is `<a>Tracker</a>` with **no href at all**. That is worse than a dead
 * link: the element is not focusable, not keyboard-reachable, and is not announced
 * as a link by assistive technology. It fails both the internal-linking rule
 * (AGENTS.md rule 4) and basic accessibility.
 *
 * Twelve such anchors shipped before this guard existed (audit 2026-09-21).
 *
 * Scope
 * -----
 * Only object-literal `href: '…'` / `src: '…'` forms are flagged, because those are
 * the ones that flow into `el()`. Direct DOM assignment (`link.href = '…'`) bypasses
 * `safeHref()` and resolves correctly in the browser, so it is deliberately NOT
 * flagged — several builders in `src/lib/cross-page-links.js` rely on that.
 *
 * Usage:
 *   node scripts/node/check-internal-hrefs.js
 *
 * Exit 0 = clean. Exit 1 = a bare-relative URL attribute was introduced.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');

/** Attribute names that `el()` passes through `safeHref()`. */
const URL_ATTRS = ['href', 'xlink:href', 'src', 'poster', 'action', 'formaction'];

/** Mirrors the `safeHref()` allowlist in src/lib/safe-dom.js. */
function isAcceptedBySafeHref(value) {
  const v = value.trim();
  if (!v) return true; // empty string is an explicit, intentional no-op
  return (
    /^https?:\/\//i.test(v) ||
    /^mailto:/i.test(v) ||
    /^tel:/i.test(v) ||
    v.startsWith('/') ||
    v.startsWith('./') ||
    v.startsWith('../') ||
    v.startsWith('#')
  );
}

/**
 * Static scanning cannot tell an `el()` attribute object from a plain data
 * object that happens to use one of the same key names — `nav.js` has
 * `{ action: 'menu', icon: …, label: … }`, which is a nav-item descriptor, not
 * markup. So only values that actually look like a URL path are considered:
 * they name a page, contain a path separator, or open a query/fragment.
 */
function looksLikeUrlPath(value) {
  const v = value.trim();
  return (
    /\.(html?|php|json|xml|svg|png|jpe?g|webp|avif|ico|css|js|txt|pdf)\b/i.test(v) ||
    v.includes('/') ||
    v.startsWith('?') ||
    v.startsWith('#')
  );
}

/**
 * A template literal whose value BEGINS with an interpolation (`${canonical}?lang=ar`)
 * has no statically-known prefix, so its safety is undecidable here and it is
 * skipped. One that merely CONTAINS an interpolation after a literal prefix
 * (`compare.html#k=${karat}`) is still decidable from that prefix, and is checked.
 */
function hasUndecidablePrefix(raw, quote) {
  return quote === '`' && raw.trimStart().startsWith('${');
}

function trackedSourceFiles() {
  const out = execFileSync('git', ['ls-files', 'src/**/*.js'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  return out.split('\n').filter(Boolean);
}

const attrAlternation = URL_ATTRS.map((a) => a.replace(':', '\\:')).join('|');
// Matches `href: '…'` / "…" / `…` in an object literal. Template literals containing
// an interpolation are skipped — their value is not statically decidable.
const ATTR_RE = new RegExp(`\\b(${attrAlternation})\\s*:\\s*(['"\`])([^'"\`\\n]*)\\2`, 'g');
// NOTE: values containing a quote of the same kind are not matched; that is fine,
// such URLs are not bare-relative page names.

function main() {
  const findings = [];
  for (const rel of trackedSourceFiles()) {
    const abs = path.join(ROOT, rel);
    let src;
    try {
      src = fs.readFileSync(abs, 'utf8');
    } catch {
      continue; // listed but absent (e.g. mid-rebase) — not this guard's problem
    }
    src.split('\n').forEach((line, i) => {
      ATTR_RE.lastIndex = 0;
      let m;
      while ((m = ATTR_RE.exec(line))) {
        const [, attr, quote, value] = m;
        if (hasUndecidablePrefix(value, quote)) continue;
        if (!looksLikeUrlPath(value)) continue;
        if (!isAcceptedBySafeHref(value)) {
          findings.push({ file: rel, line: i + 1, attr, value: value.trim() });
        }
      }
    });
  }

  if (findings.length === 0) {
    console.log(
      '[check-internal-hrefs] OK — no bare-relative URL attributes in safe-DOM literals.'
    );
    return 0;
  }

  console.error(
    `\n[check-internal-hrefs] ${findings.length} bare-relative URL attribute(s) found.\n` +
      'safeHref() rejects these, so el() drops the attribute and the element renders\n' +
      'with no href — unfocusable and invisible to assistive technology.\n' +
      'Fix: make it root-relative ("/page.html") or explicitly relative ("./page.html").\n'
  );
  for (const f of findings) {
    console.error(`  ${f.file}:${f.line}  ${f.attr}: '${f.value}'  ->  '/${f.value}'`);
  }
  console.error('');
  return 1;
}

if (require.main === module) process.exit(main());

module.exports = { isAcceptedBySafeHref, looksLikeUrlPath, hasUndecidablePrefix, URL_ATTRS };
