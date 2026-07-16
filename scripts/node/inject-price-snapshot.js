#!/usr/bin/env node

/**
 * scripts/node/inject-price-snapshot.js — Operation Midas phase 9 (fixes F1).
 *
 * POST-BUILD step: bakes the last-known price snapshot from data/gold_price.json
 * into dist/index.html so crawlers and no-JS visitors see a real, honestly
 * labeled price instead of an empty skeleton. Runs after `vite build` in the
 * npm `build` chain; every hourly price commit already triggers deploy.yml, so
 * the baked price refreshes hourly at zero extra cost.
 *
 * Honesty rules (non-negotiable):
 *   - The injected label is NEVER "Live". It is "Delayed · as of <UTC time>"
 *     when the snapshot is <= 24 h old at build time, else "Cached · as of …".
 *   - Display values come straight from the JSON's own precomputed fields
 *     (xau_usd_per_oz + karats_aed_per_gram) — nothing is re-derived with
 *     client constants.
 *   - If data/gold_price.json is missing/invalid, dist/index.html is left
 *     untouched (skeleton behavior) and the script exits 0 with a warning —
 *     it never fails the build and never injects garbage.
 *
 * Hydration safety: src/pages/home.js hydrates #hlc-price via countUp()
 * (src/lib/count-up.js), which REPLACES el.textContent wholesale and parses
 * the previous numeric value out of the existing text — so the injector writes
 * the formatted number as plain text content (no wrapper spans). The karat
 * strip hydration likewise resets className to "karat-strip-v" and replaces
 * textContent, and #hlc-updated / #karat-strip-updated get textContent +
 * data-freshness-* rewritten on hydration. Everything injected here is cleanly
 * overwritten by the first live tick.
 *
 * Usage:
 *   node scripts/node/inject-price-snapshot.js            # inject into dist/index.html
 *   node scripts/node/inject-price-snapshot.js --check    # exit 1 if dist/index.html
 *                                                         # lacks an injected labeled price
 * Options (mainly for tests):
 *   --html <path>   target HTML file  (default dist/index.html)
 *   --data <path>   snapshot JSON     (default data/gold_price.json)
 *   --now <iso>     override "now" for age classification
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const DEFAULT_HTML = path.join(ROOT, 'dist', 'index.html');
const DEFAULT_DATA = path.join(ROOT, 'data', 'gold_price.json');

/** Delayed→Cached boundary: snapshots older than this at build time are "Cached". */
const DELAYED_MAX_AGE_MS = 24 * 60 * 60 * 1000;
/** Tolerated clock skew for snapshot timestamps that sit in the future. */
const FUTURE_SKEW_MS = 10 * 60 * 1000;
/** Wide sanity band for XAU/USD per troy oz — garbage guard, not a price oracle. */
const SPOT_SANE_MIN = 100;
const SPOT_SANE_MAX = 100000;

const KARAT_KEYS = ['24k', '22k', '21k', '18k'];
/** Matches fmt.formatPrice(n, 'AED', 2) in src/lib/formatter.js. */
const AED_SYMBOL = 'د.إ';
const MARKER_RE = /<!-- gtl-price-snapshot:[^>]*-->\n?/;

function isFiniteNumber(v) {
  return typeof v === 'number' && Number.isFinite(v);
}

/**
 * Validate the gold_price.json payload for injection.
 * @returns {{ok:true, spotUsd:number, karats:Object, timestampMs:number}|{ok:false, reason:string}}
 */
function validateSnapshot(payload, nowMs) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { ok: false, reason: 'payload is not an object' };
  }
  if (payload.status !== undefined && payload.status !== 'ok') {
    return { ok: false, reason: `status is "${payload.status}", not "ok"` };
  }
  const spotUsd = payload.xau_usd_per_oz;
  if (!isFiniteNumber(spotUsd) || spotUsd < SPOT_SANE_MIN || spotUsd > SPOT_SANE_MAX) {
    return { ok: false, reason: `xau_usd_per_oz out of sane range: ${spotUsd}` };
  }
  const karats = payload.karats_aed_per_gram;
  if (!karats || typeof karats !== 'object') {
    return { ok: false, reason: 'karats_aed_per_gram missing' };
  }
  for (const key of KARAT_KEYS) {
    if (!isFiniteNumber(karats[key]) || karats[key] <= 0) {
      return { ok: false, reason: `karats_aed_per_gram.${key} invalid: ${karats[key]}` };
    }
  }
  // Purity ordering must hold (code/24 convention) — a violation means garbage data.
  if (!(
    karats['24k'] >= karats['22k'] &&
    karats['22k'] >= karats['21k'] &&
    karats['21k'] >= karats['18k']
  )) {
    return { ok: false, reason: 'karat prices violate purity ordering' };
  }
  const tsRaw = payload.timestamp_utc || payload.fetched_at_utc;
  const timestampMs = Date.parse(tsRaw || '');
  if (!Number.isFinite(timestampMs)) {
    return { ok: false, reason: `unparseable timestamp: ${tsRaw}` };
  }
  if (timestampMs > nowMs + FUTURE_SKEW_MS) {
    return { ok: false, reason: `timestamp is in the future: ${tsRaw}` };
  }
  return { ok: true, spotUsd, karats, timestampMs };
}

/** 'delayed' when the snapshot is <= 24 h old at build time, else 'cached'. NEVER 'live'. */
function classifySnapshotAge(timestampMs, nowMs) {
  return nowMs - timestampMs <= DELAYED_MAX_AGE_MS ? 'delayed' : 'cached';
}

/** Matches home.js hero formatting: en-US grouping, exactly 2 decimals, no symbol. */
function formatSpotUsd(n) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Matches fmt.formatPrice(n, 'AED', 2): "433.23 د.إ". */
function formatAedPerGram(n) {
  return `${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${AED_SYMBOL}`;
}

/** "2026-07-16 12:54 UTC" from epoch ms. */
function formatUtcTimestamp(ms) {
  const d = new Date(ms);
  const pad = (x) => String(x).padStart(2, '0');
  return (
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`
  );
}

/** "Delayed · as of 2026-07-16 12:54 UTC" — same vocabulary as tracker.refreshBadgeStale. */
function freshnessLabelText(key, timestampMs) {
  const word = key === 'cached' ? 'Cached' : 'Delayed';
  return `${word} · as of ${formatUtcTimestamp(timestampMs)}`;
}

/** Remove one or more class names from a class="…" attribute inside an opening tag. */
function stripClasses(tag, names) {
  return tag.replace(/class="([^"]*)"/, (m, cls) => {
    const kept = cls
      .split(/\s+/)
      .filter((c) => c && !names.includes(c))
      .join(' ');
    return `class="${kept}"`;
  });
}

/** Remove aria-busy="true" from an opening tag (no-op when absent). */
function stripAriaBusy(tag) {
  return tag.replace(/\s*aria-busy="true"/, '');
}

/** Set (add or replace) an attribute on an opening tag. */
function setAttr(tag, name, value) {
  const re = new RegExp(`\\s*${name}="[^"]*"`);
  if (re.test(tag)) return tag.replace(re, ` ${name}="${value}"`);
  return tag.replace(/>$/, ` ${name}="${value}">`);
}

/**
 * Replace the element with the given id: rewrite its opening tag via mapTag and
 * its inner content with newInner. Uses a non-greedy first-closer match, which
 * is correct for these leaf elements (their content never contains a nested
 * element of the same tag once the skeleton span is accounted for by callers).
 * @returns {string|null} new html, or null when the element was not found.
 */
function replaceLeafElement(html, tagName, id, mapTag, newInner) {
  const re = new RegExp(`(<${tagName}\\b[^>]*\\bid="${id}"[^>]*>)([\\s\\S]*?)(</${tagName}\\s*>)`);
  const m = html.match(re);
  if (!m) return null;
  // Guard: the captured inner must be small and must not contain a nested
  // element of the same tag whose closer we would otherwise cut short.
  if (m[2].length > 600 || m[2].includes(`<${tagName}`)) return null;
  return html.replace(re, (full, open, _inner, close) => mapTag(open) + newInner + close);
}

/**
 * Replace the freshness placeholder inside a labeled container (#hlc-updated /
 * #karat-strip-updated): swaps the nested shell-skeleton-freshness-strip span
 * (or a previously injected label on re-runs) for the label text, and stamps
 * data-freshness-key on the container tag. Window-bounded so it cannot touch
 * unrelated skeleton spans elsewhere in the document.
 * @returns {string|null}
 */
function injectFreshnessLabel(html, id, key, labelText) {
  const openRe = new RegExp(`<span\\b[^>]*\\bid="${id}"[^>]*>`);
  const openMatch = html.match(openRe);
  if (!openMatch) return null;
  const openStart = html.indexOf(openMatch[0]);
  const contentStart = openStart + openMatch[0].length;
  const window = html.slice(contentStart, contentStart + 600);

  const skeletonRe = /<span[^>]*shell-skeleton-freshness-strip[^>]*>\s*<\/span\s*>/;
  const priorLabelRe = /(?:Delayed|Cached) · as of [^<]*UTC/;
  let newWindow;
  if (skeletonRe.test(window)) {
    newWindow = window.replace(skeletonRe, labelText);
  } else if (priorLabelRe.test(window)) {
    newWindow = window.replace(priorLabelRe, labelText);
  } else {
    return null;
  }

  let newOpen = stripClasses(openMatch[0], ['skeleton-text']);
  newOpen = stripAriaBusy(newOpen);
  newOpen = setAttr(newOpen, 'data-freshness-key', key);
  return html.slice(0, openStart) + newOpen + newWindow + html.slice(contentStart + window.length);
}

/**
 * Inject the labeled snapshot into the homepage HTML.
 * @returns {{ok:true, html:string, key:string}|{ok:false, reason:string}}
 */
function injectPriceSnapshot(html, payload, nowMs = Date.now()) {
  const validated = validateSnapshot(payload, nowMs);
  if (!validated.ok) return { ok: false, reason: validated.reason };

  const { spotUsd, karats, timestampMs } = validated;
  const key = classifySnapshotAge(timestampMs, nowMs);
  const labelText = freshnessLabelText(key, timestampMs);

  // 1. Hero spot price — plain text content, exactly what countUp() writes,
  //    with the loading-skeleton class dropped so nothing shimmers over it.
  let out = replaceLeafElement(
    html,
    'div',
    'hlc-price',
    (tag) => stripAriaBusy(stripClasses(tag, ['hlc-price--loading'])),
    formatSpotUsd(spotUsd)
  );
  if (!out) return { ok: false, reason: '#hlc-price not found' };

  // 2. Hero card is no longer busy — it now holds real, labeled content.
  const heroCardRe = /<div\b[^>]*\bid="hero-live-card"[^>]*>/;
  const heroCard = out.match(heroCardRe);
  if (!heroCard) return { ok: false, reason: '#hero-live-card not found' };
  out = out.replace(heroCardRe, stripAriaBusy(heroCard[0]));

  // 3. Hero freshness chip — the visible label sitting next to the hero number.
  out = injectFreshnessLabel(out, 'hlc-updated', key, labelText);
  if (!out) return { ok: false, reason: '#hlc-updated placeholder not found' };

  // 4. Karat strip values (24/22/21/18K AED/g from the JSON's own numbers).
  for (const k of ['24', '22', '21', '18']) {
    const next = replaceLeafElement(
      out,
      'span',
      `kstrip-${k}-val`,
      (tag) => stripAriaBusy(tag.replace(/class="[^"]*"/, 'class="karat-strip-v"')),
      formatAedPerGram(karats[`${k}k`])
    );
    if (!next) return { ok: false, reason: `#kstrip-${k}-val not found` };
    out = next;
  }

  // 5. Karat strip freshness label — visible label next to the injected values.
  out = injectFreshnessLabel(out, 'karat-strip-updated', key, labelText);
  if (!out) return { ok: false, reason: '#karat-strip-updated placeholder not found' };

  // 6. Traceability marker (also what --check keys on).
  const marker = `<!-- gtl-price-snapshot: ${key} spot=${spotUsd} as-of=${new Date(timestampMs).toISOString()} injected-at=${new Date(nowMs).toISOString()} -->`;
  out = MARKER_RE.test(out)
    ? out.replace(MARKER_RE, `${marker}\n`)
    : out.replace(/<\/head>/i, `${marker}\n  </head>`);

  return { ok: true, html: out, key };
}

/** True when the HTML carries an injected, labeled price (used by --check). */
function checkInjected(html) {
  const hero = html.match(/<div\b[^>]*\bid="hlc-price"[^>]*>([\s\S]*?)<\/div>/);
  if (!hero || !/^\s*[\d,]+\.\d{2}\s*$/.test(hero[1])) return false;
  if (!/id="hlc-updated"[\s\S]{0,600}?(Delayed|Cached) · as of [^<]*UTC/.test(html)) return false;
  if (!/id="karat-strip-updated"[\s\S]{0,600}?(Delayed|Cached) · as of [^<]*UTC/.test(html)) {
    return false;
  }
  for (const k of ['24', '22', '21', '18']) {
    const val = html.match(
      new RegExp(`<span\\b[^>]*\\bid="kstrip-${k}-val"[^>]*>([\\s\\S]*?)</span\\s*>`)
    );
    if (!val || !/[\d,]+\.\d{2}/.test(val[1])) return false;
  }
  return /<!-- gtl-price-snapshot: (delayed|cached) /.test(html);
}

function parseArgs(argv) {
  const args = { check: false, html: DEFAULT_HTML, data: DEFAULT_DATA, now: Date.now() };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--check') args.check = true;
    else if (a === '--html') args.html = path.resolve(argv[++i]);
    else if (a === '--data') args.data = path.resolve(argv[++i]);
    else if (a === '--now') {
      const parsed = Date.parse(argv[++i]);
      if (Number.isFinite(parsed)) args.now = parsed;
    }
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.check) {
    if (!fs.existsSync(args.html)) {
      console.error(
        `  ❌  price-snapshot check: ${path.relative(ROOT, args.html)} not found — run npm run build first.`
      );
      process.exit(1);
    }
    const html = fs.readFileSync(args.html, 'utf8');
    if (!checkInjected(html)) {
      console.error(
        `  ❌  price-snapshot check: ${path.relative(ROOT, args.html)} lacks an injected labeled price.\n` +
          '      Run: node scripts/node/inject-price-snapshot.js'
      );
      process.exit(1);
    }
    console.log('  ✅  price-snapshot check: labeled price present in built HTML.');
    process.exit(0);
  }

  // Inject mode — every failure path is warn + exit 0: never fail the build,
  // never inject garbage; the skeleton shell remains the honest fallback.
  if (!fs.existsSync(args.html)) {
    console.warn(
      `  ⚠️  price-snapshot: ${path.relative(ROOT, args.html)} not found — skipping injection.`
    );
    process.exit(0);
  }
  let payload = null;
  try {
    payload = JSON.parse(fs.readFileSync(args.data, 'utf8'));
  } catch (err) {
    console.warn(
      `  ⚠️  price-snapshot: cannot read ${path.relative(ROOT, args.data)} (${err.message}) — HTML left untouched.`
    );
    process.exit(0);
  }
  const html = fs.readFileSync(args.html, 'utf8');
  const result = injectPriceSnapshot(html, payload, args.now);
  if (!result.ok) {
    console.warn(`  ⚠️  price-snapshot: skipped (${result.reason}) — HTML left untouched.`);
    process.exit(0);
  }
  fs.writeFileSync(args.html, result.html);
  console.log(
    `  ✅  price-snapshot: injected ${result.key} labeled price into ${path.relative(ROOT, args.html)}.`
  );
  process.exit(0);
}

module.exports = {
  validateSnapshot,
  classifySnapshotAge,
  formatSpotUsd,
  formatAedPerGram,
  formatUtcTimestamp,
  freshnessLabelText,
  injectPriceSnapshot,
  checkInjected,
  DELAYED_MAX_AGE_MS,
};

if (require.main === module) {
  main();
}
