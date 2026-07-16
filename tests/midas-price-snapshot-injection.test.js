'use strict';

/**
 * Operation Midas phase 9 (F1) — build-time labeled price snapshot injection.
 *
 * Covers scripts/node/inject-price-snapshot.js:
 *   - fresh JSON  => Delayed label + correct numbers + timestamp
 *   - stale JSON  => Cached label
 *   - garbage / missing JSON => HTML untouched, CLI exit 0 (never fail the build)
 *   - --check mode: exit 0 on injected HTML, exit 1 otherwise
 *   - hydration-overwrite contract with src/pages/home.js + src/lib/count-up.js
 *   - <noscript> honesty block in source index.html (static text, no prices)
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const SCRIPT = path.join(ROOT, 'scripts', 'node', 'inject-price-snapshot.js');

const {
  validateSnapshot,
  classifySnapshotAge,
  formatSpotUsd,
  formatAedPerGram,
  formatUtcTimestamp,
  freshnessLabelText,
  injectPriceSnapshot,
  checkInjected,
  DELAYED_MAX_AGE_MS,
} = require(SCRIPT);

// ── Fixtures ────────────────────────────────────────────────────────────────

// Mirrors the real dist/index.html structure (multi-line attributes, nested
// skeleton spans, and the `</span\n>` closer prettier emits) so the injector's
// pattern-matching is exercised against realistic markup.
const FIXTURE_HTML = `<!doctype html>
<html lang="en" dir="ltr">
  <head>
    <title>fixture</title>
  </head>
  <body class="home-page">
    <main id="main-content">
      <div
        class="hero-live-card spot-terminal ds-card"
        id="hero-live-card"
        aria-busy="true"
        aria-describedby="hlc-trust-line"
      >
        <div class="price-hero price-hero--reference">
          <div class="hlc-price-wrap price-hero__row gtl-price">
            <div
              class="hlc-price price-hero__value price-hero__value--xl hlc-price--loading gtl-price__int gtl-num"
              id="hlc-price"
              data-testid="gold-price"
            >
              <span class="skeleton-inline shell-skeleton-price-lg"></span>
            </div>
            <span class="gtl-price__cur" aria-hidden="true">$</span>
          </div>
          <span
            class="hlc-updated freshness-chip skeleton-text"
            id="hlc-updated"
            role="status"
            aria-live="polite"
            aria-atomic="true"
            ><span class="skeleton-inline shell-skeleton-freshness-strip" role="presentation" aria-hidden="true"></span></span
          >
        </div>
      </div>
      <div class="karat-strip-prices" id="karat-strip-prices">
        <div class="karat-strip-item" id="kstrip-24">
          <span class="karat-strip-k">24K</span>
          <span
            class="karat-strip-v skeleton-inline shell-skeleton-karat"
            id="kstrip-24-val"
            aria-busy="true"
          ></span>
        </div>
        <div class="karat-strip-item" id="kstrip-22">
          <span class="karat-strip-k">22K</span>
          <span
            class="karat-strip-v skeleton-inline shell-skeleton-karat"
            id="kstrip-22-val"
            aria-busy="true"
          ></span>
        </div>
        <div class="karat-strip-item" id="kstrip-21">
          <span class="karat-strip-k">21K</span>
          <span
            class="karat-strip-v skeleton-inline shell-skeleton-karat"
            id="kstrip-21-val"
            aria-busy="true"
          ></span>
        </div>
        <div class="karat-strip-item" id="kstrip-18">
          <span class="karat-strip-k">18K</span>
          <span
            class="karat-strip-v skeleton-inline shell-skeleton-karat"
            id="kstrip-18-val"
            aria-busy="true"
          ></span>
        </div>
        <div class="karat-strip-item" id="kstrip-14">
          <span class="karat-strip-k">14K</span>
          <span
            class="karat-strip-v skeleton-inline shell-skeleton-karat"
            id="kstrip-14-val"
            aria-busy="true"
          ></span>
        </div>
      </div>
      <div class="karat-strip-actions">
        <span class="karat-strip-updated" id="karat-strip-updated" aria-live="polite"
          ><span class="skeleton-inline shell-skeleton-freshness-strip" role="presentation" aria-hidden="true"></span
        ></span>
      </div>
    </main>
  </body>
</html>
`;

const FRESH_TS = '2026-07-16T12:54:08Z';
const FRESH_TS_MS = Date.parse(FRESH_TS);

function freshSnapshot(overrides = {}) {
  return {
    schema_version: 1,
    provider: 'gold_api_com',
    xau_usd_per_oz: 4002.7,
    aed_peg: 3.6725,
    timestamp_utc: FRESH_TS,
    fetched_at_utc: '2026-07-16T12:54:27Z',
    karats_aed_per_gram: { '24k': 472.61, '22k': 433.23, '21k': 413.54, '18k': 354.46 },
    status: 'ok',
    ...overrides,
  };
}

/** "now" one hour after the snapshot timestamp — well inside the Delayed window. */
const NOW_FRESH = FRESH_TS_MS + 60 * 60 * 1000;
/** "now" 25 hours after the snapshot timestamp — past the Delayed window. */
const NOW_STALE = FRESH_TS_MS + 25 * 60 * 60 * 1000;

// ── Validation + classification ─────────────────────────────────────────────

test('validateSnapshot accepts the real gold_price.json shape', () => {
  const result = validateSnapshot(freshSnapshot(), NOW_FRESH);
  assert.equal(result.ok, true);
  assert.equal(result.spotUsd, 4002.7);
  assert.equal(result.timestampMs, FRESH_TS_MS);
});

test('validateSnapshot rejects garbage payloads', () => {
  const cases = [
    [null, 'null'],
    ['nope', 'string'],
    [[1, 2], 'array'],
    [freshSnapshot({ status: 'error' }), 'status not ok'],
    [freshSnapshot({ xau_usd_per_oz: 'NaN' }), 'non-numeric spot'],
    [freshSnapshot({ xau_usd_per_oz: -5 }), 'negative spot'],
    [freshSnapshot({ xau_usd_per_oz: 5e6 }), 'absurd spot'],
    [freshSnapshot({ karats_aed_per_gram: undefined }), 'missing karats'],
    [freshSnapshot({ karats_aed_per_gram: { '24k': 472.61 } }), 'incomplete karats'],
    [
      freshSnapshot({
        karats_aed_per_gram: { '24k': 100, '22k': 433.23, '21k': 413.54, '18k': 354.46 },
      }),
      'purity ordering violated',
    ],
    [freshSnapshot({ timestamp_utc: 'not-a-date', fetched_at_utc: 'nope' }), 'unparseable ts'],
    [
      freshSnapshot({ timestamp_utc: new Date(NOW_FRESH + 60 * 60 * 1000).toISOString() }),
      'future timestamp',
    ],
  ];
  for (const [payload, label] of cases) {
    const result = validateSnapshot(payload, NOW_FRESH);
    assert.equal(result.ok, false, `expected rejection for: ${label}`);
  }
});

test('classifySnapshotAge: <=24h delayed, >24h cached — never live', () => {
  assert.equal(classifySnapshotAge(FRESH_TS_MS, NOW_FRESH), 'delayed');
  assert.equal(classifySnapshotAge(FRESH_TS_MS, FRESH_TS_MS + DELAYED_MAX_AGE_MS), 'delayed');
  assert.equal(classifySnapshotAge(FRESH_TS_MS, FRESH_TS_MS + DELAYED_MAX_AGE_MS + 1), 'cached');
  assert.equal(classifySnapshotAge(FRESH_TS_MS, NOW_STALE), 'cached');
});

test('formatters match what hydration writes', () => {
  // Hero: home.js animatePrice format — en-US grouping, 2 decimals, no symbol.
  assert.equal(formatSpotUsd(4002.7), '4,002.70');
  // Karat strip: fmt.formatPrice(n, 'AED', 2) — "<number> د.إ".
  assert.equal(formatAedPerGram(433.23), '433.23 د.إ');
  assert.equal(formatAedPerGram(1472.615), '1,472.62 د.إ');
  assert.equal(formatUtcTimestamp(FRESH_TS_MS), '2026-07-16 12:54 UTC');
  assert.equal(freshnessLabelText('delayed', FRESH_TS_MS), 'Delayed · as of 2026-07-16 12:54 UTC');
  assert.equal(freshnessLabelText('cached', FRESH_TS_MS), 'Cached · as of 2026-07-16 12:54 UTC');
});

// ── Injection ───────────────────────────────────────────────────────────────

test('fresh JSON => Delayed label + correct numbers + timestamp', () => {
  const result = injectPriceSnapshot(FIXTURE_HTML, freshSnapshot(), NOW_FRESH);
  assert.equal(result.ok, true);
  assert.equal(result.key, 'delayed');
  const html = result.html;

  // Hero: plain-text number (what countUp() overwrites), skeleton gone.
  const hero = html.match(/<div\b[^>]*\bid="hlc-price"[^>]*>([\s\S]*?)<\/div>/);
  assert.ok(hero, 'hero element present');
  assert.equal(hero[1], '4,002.70');
  assert.ok(!hero[1].includes('<'), 'hero content is plain text — hydration replaces textContent');
  assert.doesNotMatch(html, /shell-skeleton-price-lg/);
  assert.doesNotMatch(html, /hlc-price--loading/);

  // Hero card no longer aria-busy; freshness chip labeled and de-skeletoned.
  assert.doesNotMatch(html, /id="hero-live-card"[^>]*aria-busy/);
  assert.match(
    html,
    /id="hlc-updated"[\s\S]{0,400}?Delayed · as of 2026-07-16 12:54 UTC/,
    'visible freshness label next to hero price'
  );
  assert.match(html, /id="hlc-updated"[^>]*data-freshness-key="delayed"/s);
  const hlcUpdatedTag = html.match(/<span\b[^>]*\bid="hlc-updated"[^>]*>/)[0];
  assert.ok(!hlcUpdatedTag.includes('skeleton-text'), 'skeleton-text class removed');

  // Karat strip: all four injected values from the JSON's own precomputed karats.
  for (const [k, expected] of [
    ['24', '472.61 د.إ'],
    ['22', '433.23 د.إ'],
    ['21', '413.54 د.إ'],
    ['18', '354.46 د.إ'],
  ]) {
    const val = html.match(
      new RegExp(`<span\\b[^>]*\\bid="kstrip-${k}-val"[^>]*>([\\s\\S]*?)</span\\s*>`)
    );
    assert.ok(val, `kstrip-${k}-val present`);
    assert.equal(val[1], expected);
    const tag = html.match(new RegExp(`<span\\b[^>]*\\bid="kstrip-${k}-val"[^>]*>`))[0];
    assert.match(tag, /class="karat-strip-v"/, 'exact class hydration resets to');
    assert.ok(!tag.includes('aria-busy'), `kstrip-${k}-val aria-busy removed`);
  }
  // 14K has no snapshot data — its skeleton must remain untouched.
  assert.match(html, /id="kstrip-14-val"[\s\S]{0,80}aria-busy="true"/s);
  assert.match(html.match(/<span\b[^>]*\bid="kstrip-14-val"[^>]*>/)[0], /shell-skeleton-karat/);

  // Karat strip freshness label + marker.
  assert.match(html, /id="karat-strip-updated"[\s\S]{0,400}?Delayed · as of 2026-07-16 12:54 UTC/);
  assert.match(html, /<!-- gtl-price-snapshot: delayed spot=4002\.7 /);

  // Honesty: nothing injected may claim Live.
  assert.doesNotMatch(html, /data-freshness-key="live"/);
  assert.doesNotMatch(html, /Live · as of/);

  assert.equal(checkInjected(html), true);
});

test('>24h-old JSON => Cached label', () => {
  const result = injectPriceSnapshot(FIXTURE_HTML, freshSnapshot(), NOW_STALE);
  assert.equal(result.ok, true);
  assert.equal(result.key, 'cached');
  assert.match(result.html, /id="hlc-updated"[\s\S]{0,400}?Cached · as of 2026-07-16 12:54 UTC/);
  assert.match(result.html, /id="hlc-updated"[^>]*data-freshness-key="cached"/s);
  assert.match(
    result.html,
    /id="karat-strip-updated"[\s\S]{0,400}?Cached · as of 2026-07-16 12:54 UTC/
  );
  assert.doesNotMatch(result.html, /Delayed · as of/);
  assert.equal(checkInjected(result.html), true);
});

test('garbage JSON => injection refused, HTML untouched', () => {
  for (const payload of [null, {}, freshSnapshot({ status: 'stale' })]) {
    const result = injectPriceSnapshot(FIXTURE_HTML, payload, NOW_FRESH);
    assert.equal(result.ok, false);
    assert.equal(result.html, undefined);
  }
});

test('markup drift => injection refused rather than mangled output', () => {
  const result = injectPriceSnapshot(
    '<html><body>no hero here</body></html>',
    freshSnapshot(),
    NOW_FRESH
  );
  assert.equal(result.ok, false);
  assert.match(result.reason, /hlc-price/);
});

test('re-running the injector refreshes the label instead of duplicating it', () => {
  const first = injectPriceSnapshot(FIXTURE_HTML, freshSnapshot(), NOW_FRESH);
  assert.equal(first.ok, true);
  const second = injectPriceSnapshot(
    first.html,
    freshSnapshot({ xau_usd_per_oz: 4010.15 }),
    NOW_STALE
  );
  assert.equal(second.ok, true);
  assert.equal(second.key, 'cached');
  assert.match(second.html, /<div\b[^>]*\bid="hlc-price"[^>]*>4,010\.15<\/div>/);
  assert.equal((second.html.match(/(?:Delayed|Cached) · as of /g) || []).length, 2);
  assert.equal((second.html.match(/gtl-price-snapshot:/g) || []).length, 1);
  assert.equal(checkInjected(second.html), true);
});

test('checkInjected is false for the raw skeleton shell', () => {
  assert.equal(checkInjected(FIXTURE_HTML), false);
});

// ── CLI behavior (exit codes) ───────────────────────────────────────────────

function runCli(args, cwd) {
  return spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8', cwd: cwd || ROOT });
}

test('CLI: missing / invalid JSON leaves HTML untouched and exits 0', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gtl-snapshot-'));
  const htmlPath = path.join(dir, 'index.html');
  fs.writeFileSync(htmlPath, FIXTURE_HTML);

  // Missing JSON file.
  let res = runCli(['--html', htmlPath, '--data', path.join(dir, 'missing.json')]);
  assert.equal(res.status, 0, res.stderr);
  assert.equal(fs.readFileSync(htmlPath, 'utf8'), FIXTURE_HTML, 'HTML untouched on missing JSON');

  // Unparseable JSON.
  const badJson = path.join(dir, 'bad.json');
  fs.writeFileSync(badJson, '{ not json ');
  res = runCli(['--html', htmlPath, '--data', badJson]);
  assert.equal(res.status, 0, res.stderr);
  assert.equal(fs.readFileSync(htmlPath, 'utf8'), FIXTURE_HTML, 'HTML untouched on bad JSON');

  // Valid JSON but garbage values.
  const garbageJson = path.join(dir, 'garbage.json');
  fs.writeFileSync(garbageJson, JSON.stringify(freshSnapshot({ xau_usd_per_oz: -1 })));
  res = runCli(['--html', htmlPath, '--data', garbageJson]);
  assert.equal(res.status, 0, res.stderr);
  assert.equal(fs.readFileSync(htmlPath, 'utf8'), FIXTURE_HTML, 'HTML untouched on garbage data');

  fs.rmSync(dir, { recursive: true, force: true });
});

test('CLI: valid JSON injects and --check passes; --check fails pre-injection', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gtl-snapshot-'));
  const htmlPath = path.join(dir, 'index.html');
  const dataPath = path.join(dir, 'gold_price.json');
  fs.writeFileSync(htmlPath, FIXTURE_HTML);
  fs.writeFileSync(dataPath, JSON.stringify(freshSnapshot()));

  // --check before injection: exit 1.
  let res = runCli(['--check', '--html', htmlPath]);
  assert.equal(res.status, 1, 'check must fail on skeleton-only HTML');

  // Inject (with --now pinned inside the Delayed window).
  res = runCli([
    '--html',
    htmlPath,
    '--data',
    dataPath,
    '--now',
    new Date(NOW_FRESH).toISOString(),
  ]);
  assert.equal(res.status, 0, res.stderr);
  const injected = fs.readFileSync(htmlPath, 'utf8');
  assert.match(injected, /Delayed · as of 2026-07-16 12:54 UTC/);

  // --check after injection: exit 0.
  res = runCli(['--check', '--html', htmlPath]);
  assert.equal(res.status, 0, `${res.stdout}\n${res.stderr}`);

  // --check on a missing file: exit 1.
  res = runCli(['--check', '--html', path.join(dir, 'nope.html')]);
  assert.equal(res.status, 1);

  fs.rmSync(dir, { recursive: true, force: true });
});

// ── Hydration-overwrite contract ────────────────────────────────────────────

test('hydration replaces injected content wholesale (contract lock)', () => {
  const countUpSrc = fs.readFileSync(path.join(ROOT, 'src/lib/count-up.js'), 'utf8');
  // countUp writes el.textContent — replacing, never appending — so the
  // injected plain-text number is cleanly overwritten by the first live tick.
  assert.match(countUpSrc, /el\.textContent = format\(target\)/);
  // …and it parses the previous value out of the existing text, so the count-up
  // animates from the baked snapshot to the live price.
  assert.match(countUpSrc, /parseCurrentValue\(String\(el\.textContent/);

  const homeSrc = fs.readFileSync(path.join(ROOT, 'src/pages/home.js'), 'utf8');
  // Karat strip hydration resets className to exactly what the injector writes.
  assert.match(homeSrc, /valueElement\.className = 'karat-strip-v'/);
  // Hero + strip freshness labels are re-written via textContent on hydration.
  assert.match(homeSrc, /hlcUpdatedEl\.textContent = /);
  assert.match(homeSrc, /kstripUpdatedEl\.textContent = /);
});

// ── <noscript> honesty block (source index.html) ────────────────────────────

test('index.html carries a bilingual noscript note with no prices', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const noscript = html.match(/<noscript>([\s\S]*?)<\/noscript>/);
  assert.ok(noscript, 'noscript block present');
  const block = noscript[1];
  assert.match(block, /lang="en"[^>]*dir="ltr"/);
  assert.match(block, /lang="ar"[^>]*dir="rtl"/);
  assert.match(block, /methodology\.html/);
  assert.match(block, /Enable\s+JavaScript for live updates/i);
  assert.match(block, /reference/i);
  // Static explanatory text only — no baked prices in the committed source.
  assert.doesNotMatch(block, /\d[\d,]*\.\d{2}/, 'noscript must not contain price-like numbers');
  assert.doesNotMatch(block, /\bLive\b(?!\s+updates)/, 'noscript must not label data as Live');
});

// ── Integration: built output carries the labeled price ─────────────────────

test('dist/index.html (when built) contains the injected labeled price', (t) => {
  const distIndex = path.join(ROOT, 'dist', 'index.html');
  if (!fs.existsSync(distIndex)) {
    t.skip('dist/index.html not present — run npm run build for the integration assertion');
    return;
  }
  const res = runCli(['--check']);
  assert.equal(
    res.status,
    0,
    `npm run check:price-snapshot failed on dist/index.html:\n${res.stdout}\n${res.stderr}\n` +
      'If dist/ is stale, re-run npm run build.'
  );
});
