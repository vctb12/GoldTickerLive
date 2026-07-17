#!/usr/bin/env node
'use strict';

/**
 * scripts/node/csp-inventory.js — Operation Midas phase 12 (security headers).
 *
 * Evidence-based, drift-proof inventory of everything a Content-Security-Policy
 * for the PUBLIC static site has to account for. It scans the *built* site
 * (`dist/`) — never the source templates — so the hashes it emits are the exact
 * bytes a browser would hash.
 *
 * What it collects
 *   (a) Every inline (executable) `<script>` on every built page, with its
 *       CSP source hash (`sha256-<base64>`). JSON-LD blocks
 *       (`type="application/ld+json"`) are excluded — they are data, not
 *       executable script, and CSP ignores them. It also proves the
 *       `gtl-theme-preinit` inline script is byte-identical across every page
 *       (a single hash spanning all pages == identical).
 *   (b) External resource origins actually referenced by the built HTML
 *       (script/style/font/img `src`/`href`) and the runtime fetch/XHR origins
 *       reached by the client JS (scanned out of `src/`). These feed
 *       `connect-src` / `img-src` / `style-src` / `font-src`.
 *   (c) Inline-style surface (`<style>` blocks + `style=` attributes) so the
 *       `style-src` strategy ('unsafe-inline', justified in the policy doc) is
 *       grounded in evidence rather than assumption.
 *
 * Note: `scripts/node/inject-price-snapshot.js` bakes labeled price text into
 * `dist/index.html` via textContent/attributes only — it adds NO inline
 * `<script>`, so it never changes the script-src hash set. Verified by this
 * tool (index.html carries the single shared theme-preinit hash and nothing
 * more).
 *
 * Drift guard
 *   The policy doc `docs/plans/midas/SECURITY_HEADERS.md` is the source of
 *   truth for the allowed inline-script hashes. If the build produces an inline
 *   script whose hash is NOT enumerated in that doc, this tool exits non-zero.
 *   Wire it into CI so a new/edited inline script cannot silently escape CSP.
 *
 * Output
 *   Writes the full inventory JSON to `reports/csp-inventory.json` (that path is
 *   not gitignored) and prints a human summary to stdout.
 *
 * Usage
 *   node scripts/node/csp-inventory.js            # scan dist/, write report, drift-check
 *   node scripts/node/csp-inventory.js --check    # same, but do not write the JSON
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = path.resolve(__dirname, '..', '..');
const DIST_DIR = path.join(ROOT, 'dist');
const SRC_DIR = path.join(ROOT, 'src');
const POLICY_DOC = path.join(ROOT, 'docs', 'plans', 'midas', 'SECURITY_HEADERS.md');
const REPORT_PATH = path.join(ROOT, 'reports', 'csp-inventory.json');

// ── Inline-script extraction + hashing ───────────────────────────────────────

/**
 * Compute the CSP source hash for an inline script body. Browsers hash the
 * exact bytes between the opening `>` and the closing `</script>` — no trim.
 * @param {string} body
 * @returns {string} e.g. "sha256-<base64>"
 */
function cspHash(body) {
  const digest = crypto.createHash('sha256').update(body, 'utf8').digest('base64');
  return `sha256-${digest}`;
}

// Matches a `<script>` that has NO `src=` and is NOT a JSON-LD data block.
// Inline `type="module"` scripts (executable) are intentionally still matched.
const INLINE_SCRIPT_RE =
  /<script(?![^>]*\bsrc=)(?![^>]*type=["']application\/ld\+json["'])[^>]*>([\s\S]*?)<\/script>/gi;

/**
 * Extract inline (executable) script bodies from an HTML string.
 * @param {string} html
 * @returns {string[]} raw bodies, in document order
 */
function extractInlineScripts(html) {
  const bodies = [];
  let m;
  INLINE_SCRIPT_RE.lastIndex = 0;
  while ((m = INLINE_SCRIPT_RE.exec(html)) !== null) {
    bodies.push(m[1]);
  }
  return bodies;
}

/** True if a script body is the gtl-theme-preinit block (stable identity marker). */
function isThemePreinit(body) {
  return body.includes('data-theme-mode') && body.includes("classList.add('js')");
}

// ── HTML resource-origin extraction ──────────────────────────────────────────

const ATTR_URL_RE = /\b(?:src|href)=["']([^"']+)["']/gi;

/**
 * Collect external (absolute-URL) resource origins referenced by src/href in
 * the HTML. Same-origin relative refs (`/assets/...`) are ignored — they are
 * covered by `'self'`. Anchor navigation targets are also captured here; the
 * caller separates resource vs navigation intent by tag when it matters, but
 * for CSP the practical fact this proves is "no external script/style/img/font
 * is loaded from HTML" (all are `/assets/*`).
 * @param {string} html
 * @returns {string[]} distinct external origins (scheme + host)
 */
function extractHtmlAbsoluteOrigins(html) {
  const origins = new Set();
  let m;
  ATTR_URL_RE.lastIndex = 0;
  while ((m = ATTR_URL_RE.exec(html)) !== null) {
    const url = m[1];
    const proto = /^https?:\/\//i.exec(url);
    if (!proto) continue;
    try {
      origins.add(new URL(url).origin);
    } catch {
      /* ignore malformed */
    }
  }
  return [...origins].sort();
}

/**
 * Collect origins of external resources that are actually LOADED by the HTML
 * (executable/style/font/img — not `<a href>` navigation). This is what CSP's
 * script-src/style-src/img-src/font-src must cover from static markup.
 * @param {string} html
 * @returns {{script:string[],style:string[],img:string[],font:string[]}}
 */
function extractHtmlResourceOrigins(html) {
  const buckets = { script: new Set(), style: new Set(), img: new Set(), font: new Set() };
  const add = (bucket, url) => {
    if (!/^https?:\/\//i.test(url)) return;
    try {
      buckets[bucket].add(new URL(url).origin);
    } catch {
      /* ignore */
    }
  };
  let m;
  const scriptRe = /<script[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi;
  while ((m = scriptRe.exec(html)) !== null) add('script', m[1]);
  const linkRe = /<link\b[^>]*>/gi;
  while ((m = linkRe.exec(html)) !== null) {
    const tag = m[0];
    const href = /\bhref=["']([^"']+)["']/i.exec(tag);
    if (!href) continue;
    const rel = (/\brel=["']([^"']+)["']/i.exec(tag) || [, ''])[1].toLowerCase();
    const asAttr = (/\bas=["']([^"']+)["']/i.exec(tag) || [, ''])[1].toLowerCase();
    if (rel.includes('stylesheet')) add('style', href[1]);
    else if (asAttr === 'font' || /\.woff2?($|\?)/i.test(href[1])) add('font', href[1]);
    else if (asAttr === 'style') add('style', href[1]);
    else if (asAttr === 'image') add('img', href[1]);
  }
  const imgRe = /<img[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi;
  while ((m = imgRe.exec(html)) !== null) add('img', m[1]);
  return {
    script: [...buckets.script].sort(),
    style: [...buckets.style].sort(),
    img: [...buckets.img].sort(),
    font: [...buckets.font].sort(),
  };
}

/**
 * Inline-style surface: count `<style>` blocks and detect any `style=` attr.
 * @param {string} html
 * @returns {{styleTags:number, hasStyleAttr:boolean}}
 */
function extractInlineStyleSurface(html) {
  const styleTags = (html.match(/<style\b[^>]*>/gi) || []).length;
  const hasStyleAttr = /\sstyle=["']/i.test(html);
  return { styleTags, hasStyleAttr };
}

// ── Runtime fetch-origin extraction (client JS) ──────────────────────────────

// Network-call-site patterns. Each captures the HOST of an origin the client
// actually connects to at runtime. These are deliberately scoped to genuine
// call sites (fetch/endpoint-constant/url-const) so anchor hrefs, attribution
// links, schema.org ids, and prose URLs are NOT mistaken for connect-src needs.
const FETCH_ORIGIN_PATTERNS = [
  /\bfetch\(\s*['"`]https?:\/\/([a-z0-9.-]+)/gi,
  /\b(?:ENDPOINT|API_URL|API_FX_URL|SUPABASE_URL)\s*[:=]\s*['"`]https?:\/\/([a-z0-9.-]+)/gi,
  /\b(?:const|let|var)\s+url\s*=\s*['"`]https?:\/\/([a-z0-9.-]+)/gi,
];

// Hosts that are the site's own origin (or local dev) — never external connects.
const SELF_HOSTS = new Set(['goldtickerlive.com', 'www.goldtickerlive.com', 'localhost']);

function listJsFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listJsFiles(p));
    else if (/\.(js|mjs|cjs)$/.test(entry.name)) out.push(p);
  }
  return out;
}

/**
 * Scan a source tree for the external origins the client JS fetches at runtime.
 * @param {string} srcDir
 * @returns {{host:string, files:string[]}[]} sorted by host
 */
function collectFetchOrigins(srcDir) {
  const map = new Map();
  for (const file of listJsFiles(srcDir)) {
    const text = fs.readFileSync(file, 'utf8');
    for (const re of FETCH_ORIGIN_PATTERNS) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(text)) !== null) {
        const host = m[1].toLowerCase();
        if (SELF_HOSTS.has(host)) continue;
        if (!map.has(host)) map.set(host, new Set());
        map.get(host).add(path.relative(srcDir, file));
      }
    }
  }
  return [...map.entries()]
    .map(([host, files]) => ({ host, files: [...files].sort() }))
    .sort((a, b) => a.host.localeCompare(b.host));
}

// ── Policy-doc parsing (drift source of truth) ───────────────────────────────

/**
 * Extract the enumerated inline-script hashes from the policy markdown.
 * @param {string} md
 * @returns {Set<string>}
 */
function parsePolicyHashes(md) {
  const set = new Set();
  const re = /sha256-[A-Za-z0-9+/]+=*/g;
  let m;
  while ((m = re.exec(md)) !== null) set.add(m[0]);
  return set;
}

/**
 * Extract the `connect-src` origin tokens from the policy markdown. Reads the
 * first fenced-ish `connect-src ...;` directive it finds.
 * @param {string} md
 * @returns {string[]} tokens with scheme stripped, e.g. "api.gold-api.com", "*.supabase.co"
 */
function parseConnectSrc(md) {
  const m = /connect-src\s+([^;]+);/i.exec(md);
  if (!m) return [];
  return m[1]
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => t.replace(/^https?:\/\//i, ''))
    .filter((t) => t && t !== "'self'");
}

/**
 * Wildcard-aware host membership: is `host` covered by `token`?
 * token may be an exact host or a `*.domain` wildcard.
 */
function hostCoveredBy(host, token) {
  const bare = token.replace(/^https?:\/\//i, '').replace(/\/$/, '');
  if (bare === host) return true;
  if (bare.startsWith('*.')) {
    const suffix = bare.slice(1); // ".domain"
    return host === bare.slice(2) || host.endsWith(suffix);
  }
  return false;
}

// ── Inventory builder ────────────────────────────────────────────────────────

function listHtmlToScan(distDir) {
  const files = [];
  for (const f of fs.readdirSync(distDir)) {
    if (f.endsWith('.html')) files.push(path.join(distDir, f));
  }
  const assetsDir = path.join(distDir, 'assets');
  if (fs.existsSync(assetsDir)) {
    for (const f of fs.readdirSync(assetsDir)) {
      if (f.endsWith('.html')) files.push(path.join(assetsDir, f));
    }
  }
  return files.sort();
}

/**
 * Build the full CSP inventory for a built site.
 * @param {{distDir?:string, srcDir?:string}} [opts]
 */
function buildInventory({ distDir = DIST_DIR, srcDir = SRC_DIR } = {}) {
  if (!fs.existsSync(distDir)) {
    throw new Error(`dist/ not found at ${distDir} — run "npm run build" first.`);
  }
  const htmlFiles = listHtmlToScan(distDir);

  const inlineScripts = new Map(); // hash -> { files:Set, byteLength, isThemePreinit, preview }
  const htmlAbsoluteOrigins = new Set();
  const htmlResourceOrigins = {
    script: new Set(),
    style: new Set(),
    img: new Set(),
    font: new Set(),
  };
  let styleTagTotal = 0;
  let pagesWithStyleAttr = 0;
  const themePreinitHashes = new Set();

  for (const file of htmlFiles) {
    const rel = path.relative(distDir, file);
    const html = fs.readFileSync(file, 'utf8');

    for (const body of extractInlineScripts(html)) {
      const hash = cspHash(body);
      if (!inlineScripts.has(hash)) {
        inlineScripts.set(hash, {
          files: new Set(),
          byteLength: Buffer.byteLength(body, 'utf8'),
          isThemePreinit: isThemePreinit(body),
          preview: body.trim().replace(/\s+/g, ' ').slice(0, 60),
        });
      }
      inlineScripts.get(hash).files.add(rel);
      if (isThemePreinit(body)) themePreinitHashes.add(hash);
    }

    for (const o of extractHtmlAbsoluteOrigins(html)) htmlAbsoluteOrigins.add(o);
    const res = extractHtmlResourceOrigins(html);
    for (const k of Object.keys(htmlResourceOrigins)) {
      for (const o of res[k]) htmlResourceOrigins[k].add(o);
    }
    const styleSurface = extractInlineStyleSurface(html);
    styleTagTotal += styleSurface.styleTags;
    if (styleSurface.hasStyleAttr) pagesWithStyleAttr += 1;
  }

  const fetchOrigins = collectFetchOrigins(srcDir);

  const inlineScriptList = [...inlineScripts.entries()]
    .map(([hash, v]) => ({
      hash,
      pages: v.files.size,
      files: [...v.files].sort(),
      byteLength: v.byteLength,
      isThemePreinit: v.isThemePreinit,
      preview: v.preview,
    }))
    .sort((a, b) => b.pages - a.pages);

  return {
    generatedAt: new Date().toISOString(),
    distDir: path.relative(ROOT, distDir),
    htmlFilesScanned: htmlFiles.length,
    inlineScripts: {
      distinctHashes: inlineScriptList.length,
      themePreinitConsistent: themePreinitHashes.size === 1,
      themePreinitHashCount: themePreinitHashes.size,
      entries: inlineScriptList,
    },
    htmlResourceOrigins: {
      script: [...htmlResourceOrigins.script].sort(),
      style: [...htmlResourceOrigins.style].sort(),
      img: [...htmlResourceOrigins.img].sort(),
      font: [...htmlResourceOrigins.font].sort(),
    },
    htmlAbsoluteOrigins: [...htmlAbsoluteOrigins].sort(),
    inlineStyle: {
      styleTagTotal,
      pagesWithStyleAttr,
      styleSrcStrategy: "'unsafe-inline'",
      note: "Inline <style> blocks (404/offline) and style= attributes exist; hashing every attribute is impractical, so style-src uses 'unsafe-inline' (styles cannot exfiltrate data or execute — pragmatic and low-risk). Justified in SECURITY_HEADERS.md.",
    },
    fetchOrigins,
  };
}

// ── CLI ──────────────────────────────────────────────────────────────────────

function main(argv) {
  const check = argv.includes('--check');
  let inventory;
  try {
    inventory = buildInventory();
  } catch (err) {
    console.error(`[csp-inventory] ${err.message}`);
    return 1;
  }

  // Drift guard: every inline-script hash must be enumerated in the policy doc.
  let policyHashes = new Set();
  const policyExists = fs.existsSync(POLICY_DOC);
  if (policyExists) {
    policyHashes = parsePolicyHashes(fs.readFileSync(POLICY_DOC, 'utf8'));
  }
  const missing = inventory.inlineScripts.entries
    .map((e) => e.hash)
    .filter((h) => !policyHashes.has(h));

  if (!check) {
    fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
    fs.writeFileSync(REPORT_PATH, `${JSON.stringify(inventory, null, 2)}\n`, 'utf8');
  }

  // Summary
  console.log('── CSP inventory (built site) ────────────────────────────────');
  console.log(`HTML pages scanned:        ${inventory.htmlFilesScanned}`);
  console.log(`Distinct inline scripts:   ${inventory.inlineScripts.distinctHashes}`);
  console.log(
    `theme-preinit identical:   ${inventory.inlineScripts.themePreinitConsistent ? 'yes' : 'NO (multiple hashes!)'}`
  );
  for (const e of inventory.inlineScripts.entries) {
    console.log(
      `  ${e.hash}  (${e.pages} page${e.pages === 1 ? '' : 's'}${e.isThemePreinit ? ', theme-preinit' : ''})  ${e.preview}`
    );
  }
  console.log('Runtime fetch origins (src/):');
  for (const o of inventory.fetchOrigins) console.log(`  ${o.host}  <- ${o.files.join(', ')}`);
  console.log(
    `External HTML resource origins: script=${inventory.htmlResourceOrigins.script.length} style=${inventory.htmlResourceOrigins.style.length} img=${inventory.htmlResourceOrigins.img.length} font=${inventory.htmlResourceOrigins.font.length} (all empty == everything self-hosted)`
  );
  console.log(
    `Inline styles: ${inventory.inlineStyle.styleTagTotal} <style> blocks, ${inventory.inlineStyle.pagesWithStyleAttr} pages with style= attr -> style-src ${inventory.inlineStyle.styleSrcStrategy}`
  );
  if (!check) console.log(`Wrote ${path.relative(ROOT, REPORT_PATH)}`);

  if (!inventory.inlineScripts.themePreinitConsistent) {
    console.error(
      `[csp-inventory] FAIL: gtl-theme-preinit resolved to ${inventory.inlineScripts.themePreinitHashCount} distinct hashes — it must be byte-identical across pages.`
    );
    return 1;
  }

  if (!policyExists) {
    console.error(
      `[csp-inventory] FAIL: policy doc not found at ${path.relative(ROOT, POLICY_DOC)}.`
    );
    return 1;
  }
  if (missing.length > 0) {
    console.error(
      `[csp-inventory] DRIFT: ${missing.length} inline-script hash(es) are NOT enumerated in ${path.relative(ROOT, POLICY_DOC)}:`
    );
    for (const h of missing) console.error(`  ${h}`);
    console.error(
      '  Add the hash to the script-src directive in SECURITY_HEADERS.md (and update the Cloudflare rule), or remove the inline script.'
    );
    return 1;
  }
  console.log('Drift check: OK (all inline-script hashes enumerated in policy doc).');
  return 0;
}

module.exports = {
  cspHash,
  extractInlineScripts,
  isThemePreinit,
  extractHtmlAbsoluteOrigins,
  extractHtmlResourceOrigins,
  extractInlineStyleSurface,
  collectFetchOrigins,
  parsePolicyHashes,
  parseConnectSrc,
  hostCoveredBy,
  buildInventory,
  FETCH_ORIGIN_PATTERNS,
  POLICY_DOC,
  REPORT_PATH,
};

if (require.main === module) {
  process.exit(main(process.argv.slice(2)));
}
