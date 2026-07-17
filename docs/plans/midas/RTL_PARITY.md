# Operation Midas — Phase 18: Arabic / RTL Full Parity Matrix

_Date: 2026-07-17 · Branch: `claude/operation-midas-goldtickerlive-6b32h3` · Regression lock:
`tests/rtl-numeral-policy.test.js` (8 tests)_

## Scope and method

Runtime parity audit of the template set in **Arabic first-load mode** (`?lang=ar` — the exact URL
shape the language switcher and hreflang alternates link to). Each page was built (`npm run build`),
statics staged (`scripts/node/stage-dist-statics.js`), served from `dist/` over `http.server:8080`,
and loaded with Playwright/Chromium at 390×844. i18n on this product is **client-side**
(`src/config/translations.js` + per-page local `T` dicts + `data-i18n` on home); each page sets
`documentElement.lang`/`dir` itself. **There is no `/ar/` mirror and none was created** (that is
Phase 19, owner-gated).

Per template, six signals were checked:

1. **dir applied** — `documentElement.dir === 'rtl'` after boot.
2. **layout mirrored** — no document-level horizontal overflow at 390px; shared chrome mounted;
   price/delta elements intentionally LTR-isolated (not "LTR-stuck").
3. **numerals** — which digit script renders (see policy below).
4. **untranslated** — leaked EN UI strings / raw `UPPER.CASE.DOT` keys in the AR DOM.
5. **overflow** — AR-label truncation / clipping.
6. **chart-rtl** — chart axis/tooltip behaviour in RTL (heatmap, tracker).

## Sitewide numeral policy (decided + locked)

**Policy: all numeric OUTPUT — prices, quantities, percentages, compact figures, dates, relative
times — renders with WESTERN (Latin `0-9`) digits in both English and Arabic.** Eastern-Arabic
(`٠-٩`) / Persian (`۰-۹`) digits are accepted only as user **input** (normalised to Western by
`src/lib/weight-units.js`) and must never appear in formatted output.

**Evidence this is the real, enforced policy (not a coin-flip):**

- `formatPrice()` hard-codes `en-US` grouping → Western, language-independent
  (`src/lib/formatter.js:44`).
- `formatNumber` / `formatCurrency` / `formatCompactNumber` / `formatRelativeTime` /
  `formatTimestamp` / `formatDate` route Arabic through `localeFor('ar') === 'ar-AE'`
  (`src/lib/formatter.js:225`), whose CLDR default numbering system is `latn` (Western). Verified at
  runtime: `formatNumber(1234567.89,'ar') → "1,234,567.89"`, `formatDate('…','ar') → "5 أبريل"`
  (Arabic month name, **Western** day).
- Runtime audit: 8 of 12 templates render **zero** Eastern-Arabic digits; the price/data surfaces
  (tracker, calculator, compare, heatmap, portfolio, dubai landing) are uniformly Western.

This matches how mainstream GCC gold/finance surfaces present prices and keeps a single, unmixed
digit script. **The policy was confirmed, not flipped** — the formatter layer already enforces
Western; this phase locks it against regression (see below) and ledgers the stray Eastern-Arabic
literals that violate it.

**What could break it (the guarded regression):** changing `localeFor` to `ar-EG` / `ar-SA` / bare
`ar`, or appending `-u-nu-arab`, silently converts **every price and count** to Eastern-Arabic
digits. That one-word edit is now caught by `tests/rtl-numeral-policy.test.js`, which asserts every
Arabic-mode formatter emits Western digits and no `٠-٩` / `۰-۹` glyph.

## Parity matrix

Legend: **PASS** = clean · **FIX** = fixed this phase · **FOLLOWUP** = real gap, out of this phase's
template fence (page HTML / page module), ledgered below.

| Template         | dir applied | layout mirrored | numerals     | untranslated | overflow | chart-rtl |
| ---------------- | ----------- | --------------- | ------------ | ------------ | -------- | --------- |
| index (home)     | PASS        | PASS            | FOLLOWUP (¹) | PASS         | PASS     | n/a       |
| tracker          | PASS        | PASS            | PASS         | PASS         | PASS     | PASS (⁵)  |
| calculator       | PASS        | PASS            | PASS         | PASS         | PASS     | n/a       |
| compare          | PASS        | PASS            | PASS         | PASS         | PASS     | n/a       |
| heatmap          | PASS        | PASS            | PASS         | PASS         | PASS     | PASS (⁶)  |
| portfolio        | PASS        | PASS            | PASS         | PASS         | PASS     | PASS      |
| market           | PASS        | PASS            | FOLLOWUP (²) | PASS         | PASS     | n/a       |
| shops            | PASS        | PASS            | FOLLOWUP (³) | PASS         | PASS     | n/a       |
| methodology      | PASS        | PASS            | PASS         | PASS         | PASS     | n/a       |
| learn            | PASS        | PASS            | FOLLOWUP (⁴) | PASS         | PASS     | n/a       |
| glossary         | PASS        | PASS            | PASS         | PASS         | PASS     | n/a       |
| dubai-gold-price | PASS        | PASS            | PASS         | PASS         | PASS     | n/a       |

**Policy lock (all templates):** FIX-APPLIED — `tests/rtl-numeral-policy.test.js` locks the
Western-digit formatter layer that feeds every runtime-rendered number on all 12 templates.

### Notes

- **layout mirrored:** every template settles to `dir=rtl` / `lang=ar` with **0 px** document
  overflow at 390 px. Price and signed-delta elements (`.hlc-price`, `.hlc-change`, `.gcc-price`,
  `.karat-strip-v`, tracker pills) render with an internal LTR direction **on purpose** — a price /
  `+1.25%` is a bidi-neutral token that must stay left-to-right inside RTL prose (see
  `bidiIsolate()` and `tests/bidi-isolate.test.js` /
  `tests/e2e/rtl-signed-delta-isolation.spec.js`). These are correct isolation, not "LTR-stuck"
  layout bugs.
- **untranslated:** no leaked UI strings or raw keys. The only Latin text in AR shared chrome is
  legitimately literal: the brand (`Gold Ticker Live`), the language-switch button label (`English`
  — correct: it names the target language), provider domains (`Gold-API.com`, `open.er-api.com` —
  provider labels are sacred/truthful), the social handle (`@GoldTickerLive`), the metal/currency
  pair code (`XAU/USD`), and photo attribution credits (proper names + CC license codes).

### Chart RTL evidence

- (⁵) tracker chart — covered by existing runtime coverage; axis/tooltip render without error in AR.
- (⁶) heatmap tooltip RTL — locked by `tests/e2e/heatmap-rtl-tooltip.spec.js`.

## Follow-ups (Eastern-Arabic digit literals violating the Western policy)

These are **outside this phase's fence** (Phase 18 fence = shared components, shared CSS logical
properties, `translations.js` parity fills, i18n libs, this doc, tests — **not** page HTML rewrites
and **not** page modules). Each is a hard-coded Eastern-Arabic digit that should be normalised to
Western to satisfy the locked policy. None affect prices/data (all are decorative or prose).

1. **(¹) index — QuickConvert retail note.** `src/config/translations.js:2341` embeds `و٥٪` ("and 5%
   VAT"). Normalise the `٥` → `5`. In-file but not a parity fill, so deferred to keep the fence
   clean; EN counterpart already reads `5%`.
2. **(²) market — chain step badges.** `market.html` AR `data-lang-block` hard-codes step numbers
   `١ ٢ ٣ ٤ ٥ ٦` (`.mkt-step-num`, `aria-hidden` so decorative). EN block uses `1-6`. Normalise the
   AR block to Western.
3. **(³) shops — directory-reviewed date.** `src/pages/shops.js:1053` formats the review date with
   `toLocaleDateString('ar-EG', …)` → `٥ أبريل ٢٠٢٦`. Switch to `'ar-AE'` (Western: `5 أبريل 2026`)
   to match the formatter-layer policy and the rest of the site.
4. **(⁴) learn — hub stat pill.** `learn.html` AR `data-lang-block` hard-codes `٩ أدلة عملية` ("9
   practical guides"). Normalise the `٩` → `9`.

Recommended sequencing: fold (1)–(4) into the next page-surface phase (Phase 19+ page work), where
page HTML/module edits are in-fence. When done, extend `tests/rtl-numeral-policy.test.js` with a
static scan asserting no committed page HTML embeds an Eastern-Arabic digit in a `data-lang-block`
AR block.
