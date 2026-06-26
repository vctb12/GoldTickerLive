# Gold Ticker Live — Overhaul Session Report (2026-06-26)

**Branch:** `claude/tracker-html-revamp-bpk97i` · **Baseline:** 1205 tests → **1214 pass / 0 fail**
after this session. Every commit ended green on the full gate (tests + lint + style + validate +
build). No pushes to `main`. **LOCKED invariants untouched** (proof below).

This is the resumable record of the total-overhaul brief. It separates **VERIFIED** (with pasted
evidence) from **OUTSTANDING**.

---

## LOCKED-invariant confirmation (VERIFIED)

Pricing-math assertion against `src/config/constants.js` + `src/config/karats.js` (no pricing code
was touched this session):

```
AED_PEG = 3.6725 | TROY_OZ_GRAMS = 31.1035
spot $4,048.60 → 24K AED/g = 4048.60/31.1035 × 3.6725 = 478.03   ✅ (exact match)
purity: 22K=0.9167 (22/24)  21K=0.875 (21/24)  18K=0.75 (18/24)  ✅
22K AED/g = 438.20  21K = 418.28  18K = 358.52
```

Freshness honesty, reference-vs-retail separation, the URL-hash + mode/IA contracts, and the 90s
refresh / dual-cache / SW fallback were all preserved (several were _strengthened_ — see D8 and the
freshness-label fix).

---

## Defect-closure table

| ID     | Status                          | Root cause                                                                                                                                                                    | Fix                                                                                                                                                                                                                                      | Evidence                                                                               |
| ------ | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **D1** | ✅ FIXED                        | Parent-country breadcrumbs + README/docs used the dead `/countries/<slug>.html` form; GitHub Pages ignores the `_redirects` `.html→/` rules so they hard-404                  | Pointed the 2 market-page breadcrumbs at `../../../countries/<slug>/`; swept README + docs to directory form                                                                                                                             | `grep` shows 0 dead refs in deployed HTML; target `index.html` files exist; gate green |
| **D2** | ✅ FIXED                        | `404.html` + `offline.html` loaded `assets/analytics.js` _relatively_; served at arbitrary depth → resolves to e.g. `/countries/assets/analytics.js` (404)                    | Changed both to root-absolute `/assets/analytics.js` (matches every other asset on those pages)                                                                                                                                          | diff; both pages now 100% root-absolute                                                |
| **D3** | ✅ VERIFIED OK (no code change) | `shop_listings`/`shops` 404 is a Supabase provisioning/RLS matter, not a client bug                                                                                           | `fetchShops()` uses the **anon** key (no service-role leak), probes both endpoints, returns null on failure → `shops.js` falls back to `data/shops.js`. Graceful, labeled, never a silent blank                                          | `src/lib/supabase-data.js:58-88`                                                       |
| **D4** | 🟡 PARTIAL/VERIFY               | Earlier full-page AR capture showed ~8× overflow                                                                                                                              | Tracker RTL surface is well-maintained (audit) and the harness shows **0 horizontal overflow** on tracker EN/AR @ 390/1366. Home `?lang=ar` did not flip `dir` in-harness (home reads lang differently) — needs a home-specific RTL pass | `/tmp/qa-*.json` overflowPx=0 on tracker                                               |
| **D5** | ✅ FIXED                        | `http-equiv="X-Frame-Options"` meta is ignored by browsers (console warning every page); real header already set in `_headers`/`.htaccess`                                    | Removed the dead line from all **383** tracked HTML files                                                                                                                                                                                | `grep` = 0 remaining; `check-seo-meta` scanned 390 files green; console warning gone   |
| **D6** | ✅ FIXED                        | Hero `<h1>` wrapped a JS-filled kicker + sub-tagline → run-on accessible name `"Gold command center Gold Command Center Spot-linked…"`                                        | Demoted kicker (aria-hidden, decorative duplicate) + tagline to siblings; `<h1>` now holds only the title                                                                                                                                | Playwright: `h1count=1`, name = `['Gold Command Center']`                              |
| **D7** | ⬜ OUTSTANDING                  | Imagery ~100% CSS/SVG                                                                                                                                                         | Belongs to the Phase C redesign (real `<img>` where raster belongs)                                                                                                                                                                      | —                                                                                      |
| **D8** | ✅ FIXED + GUARDED              | Missing tracker i18n keys → `trackerTx` returns the truthy raw key, so `tracker.commandMeta.heading` (and `readout.*`, and the computed `source.estimated`) rendered verbatim | Added the missing EN+AR keys; added `tests/tracker-i18n-key-coverage.test.js` (literal-key scan + freshness-state + tab-label coverage)                                                                                                  | Playwright: **0 leaked keys** across tracker+home × EN/AR × 390/1366                   |
| **D9** | ⬜ OUTSTANDING                  | ~16 font files on homepage                                                                                                                                                    | Phase F (subset Latin+Arabic, `font-display:swap`, preload critical)                                                                                                                                                                     | —                                                                                      |

### Additional fixes beyond the D-list

- **Freshness-honesty trust fix** (the §2 invariant): the chart's synthetic current-price row + CSV/
  JSON exports stamped `source:'live'` from the binary `hasLiveFailure`, so delayed/cached/stale/
  fallback data was labeled "live". Routed through a tested `deriveLiveRowFreshness` +
  `rowFreshnessState` backed by `getFreshnessModel().effectiveKey`. +4 tests.
- **a11y batch:** single price live region (removed the nested `#tp-live-badge` announcer → no
  double-announce), ESC-closes-modal-while-typing, 44px touch targets + the missing
  `.tracker-remove-btn` rule.
- **EN/AR parity:** the 7 workspace tab labels now localize (verified `dir=rtl` +
  `مباشر/مقارنة/الأرشيف/تنبيهات/المخطط/تصدير/المنهجية`).
- **Dead-code:** deleted unused `formatting.js`; removed no-op `escape()` calls.
- **Docs (Phase 0):** README test-count drift (`205/350` → `1,200+`); `tracker-state.md` freshness
  drift (`4 states/12 min` → canonical 6 base keys + `closed`/`estimated`, 30/75-min thresholds).

---

## Commits (12, all gated green)

`f8dbcb2` freshness-honesty exports · `6b752ab` dead-code · `1bdc580` D8 readout/commandMeta ·
`5f67116` a11y batch · `02c3e9b` D8 source.estimated + QA harness · `a4efa3d` D5 X-Frame · `d848474`
D6 h1 · `c5638a1` tab-label i18n · `deb9ea8` D1 country links · `2a65fd1` D2 analytics path ·
`6f73de3` doc reconciliation · `0888591` 50-phase plan.

## Verification receipts

- `npm test` → **1214 / 0**. `npm run lint`, `npm run style`, `npm run validate`, `npm run build` →
  all exit 0 (run per commit).
- Playwright (Appendix-A harness, pinned Chromium 1194, `domcontentloaded`+`waitForSelector`):
  tracker
  - home @ 390/1366 EN/AR — 0 leaked keys, 0 tracker overflow, clean h1.
- Pricing assertion: 24K = 478.03 ✅.

---

## i18n parity track — BEFORE / AFTER + guard coverage

Two Ultracode workflows mapped the parity gap: **183** verified-unhydrated strings in the tracker +
**95** across home/calculator/shops/methodology/country = **~278 EN/AR-parity strings** (the
original audit's "~120" was a low estimate). Datasets committed under `docs/plans/_artifacts/`.

### Counts

| Surface                                        | Before (unhydrated)                          | After (localized this session)                                                                                                                                                   | Remaining                                             |
| ---------------------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Tracker                                        | 183                                          | ~129 — hero/readout/commandMeta, 8 `source.*`, 7 tabs, live-toolbar (chips + events.js auto-refresh/wire), **103 `data-i18n`** across exports/archive/planner/alerts/chart/karat | wire+keyboard (~25), method-mode rich bodies (~29)    |
| Home                                           | ~30                                          | 10 (`data-i18n` chrome: skip link, GCC tabs, OHLC labels, export aria, explainer links)                                                                                          | FAQ accordion (rich answers), hero/section copy (~20) |
| Calculator / shops / methodology / country     | ~65                                          | 0 (dataset ready)                                                                                                                                                                | ~65                                                   |
| **Leaked raw keys (runtime, 6 pages × EN/AR)** | **≥1 (`tracker.source.estimated` observed)** | **0**                                                                                                                                                                            | 0                                                     |

`translations.js`: **915 → 1113 EN keys = 1113 AR keys** (perfectly symmetric). Localized via the
new generic `data-i18n` hydrators in `tracker-pro.js` + `home.js` (one attribute per string).

### Guard coverage (the new safety net)

**Static — `tests/i18n-sitewide-guard.test.js` (runs in `npm test` → CI):**

1. EN/AR key-set parity — identical key sets (fails if any key is one-language-only).
2. Global-helper key references — every literal key passed to a `TRANSLATIONS`-backed helper (home
   `tx`/`txGlobal`, tracker `trackerTx`/`tx`, country `page-hydrator` `tx`→`country.*`) must exist.
3. `data-i18n` attribute coverage — every `data-i18n*` key in `tracker.html` + `index.html`
   resolves.

Plus `tests/tracker-i18n-key-coverage.test.js` (4 tracker-specific computed-key guards: literal
keys, freshness `source.*`, tab labels, `data-i18n`).

**Runtime — `scripts/qa/leaked-key-scan.mjs` (`npm run i18n:leaked-scan`):** loads home, tracker,
calculator, shops, methodology, country in EN+AR and fails if any visible text is a raw key
(`namespace.key.key` / `UPPER.CASE.DOT`) — catches leaks from ANY helper, including the local-dict
pages (calculator `T`, shops `TXT`) the static layer can't model. **Result: 0 leaks.**

### Section-by-section (tracker)

- ✅ Batch 0 — 187 inert keys · ✅ hero/source/tabs · ✅ live-toolbar · ✅ exports · ✅ archive · ✅
  planner · ✅ alerts · ✅ chart-panel + karat table · ✅ home chrome.
- ⬜ Remaining: tracker wire/keyboard-help, method-mode rich bodies; home FAQ; calculator, shops,
  methodology, country pages (datasets ready).

> **Integrator notes (verified):** (1) `chart.stat*` cards are JS-rebuilt by `chart.js` via
> `tx('historical.summary.*')` — already localized, do not double-wire. (2) The alerts overlay was
> partially pre-wired (delivery/email labels) — only the unwired chrome was tagged. (3) Always grep
> for existing `setNodeText`/`setButtonCopy` wiring of an id before tagging (e.g. the compare export
> buttons use `compare.exportLabel`). (4) Rich content with inline `<code>`/`<a>` (method bodies,
> FAQ answers) needs `setInlineLinkText` or fragment-splitting, not `data-i18n` textContent.

## OUTSTANDING (the bulk of the overhaul — for follow-up PRs)

1. **i18n parity Batches 2–6** — per the dataset + the integrator note above. Gated per section,
   serialize edits to translations.js / tracker.html / tracker-pro.js, Playwright-verify each in AR.
2. **Phase C — design-token system + full visual redesign** of home + tracker, then propagate. Needs
   Playwright before/after evidence per change.
3. **Phase B — 167-page regeneration pipeline** + dead-CSS/asset purge (the `tracker-pro.css` is 121
   KB; run an unused-selector pass).
4. **D4 home RTL**, **D7 imagery**, **D9 fonts**, **Phase E SEO/schema/hreflang**, **Phase F perf/
   contrast/CLS/LCP**, **Phase G trust polish**, the debug-panel failure-simulation + offline SW QA.
5. **README full prose reconciliation** beyond the test-count fix.
