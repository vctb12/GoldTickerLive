# Harsh cleanup, slimming & functional pass — 2026-05-29

```yaml plan-status
status: complete
priority: P2
class: A
owner: @vctb12
last_run_at: '2026-05-29T21:00:00Z'
last_run_pr: 'pending'
last_run_agent: copilot
slices_remaining_estimate: 0
next_action: 'merge PR'
blocked_on: ''
guardrails_reviewed: true
skills_used: [gold-ticker-live-audit, frontend-design-system]
```

## Origin

Captured from the prompt: _"harsh website cleaning … harsh code cleaning … harsh stripping and
slimming … make it fully functional based on the features in it already."_ (2026-05-29). Granted
full autonomy to scope and execute.

This continues the never-executed removal phases of
[`docs/plans/REPO_CLEANUP_PROPOSAL.md`](./REPO_CLEANUP_PROPOSAL.md) (Phase 1 audit shipped in
`reports/cleanup-audit/`, Phases 2–4 were gated and never run).

## Baseline (verified before any change)

- `npm run lint` → PASS
- `npm test` → PASS (913/915 — 2 pre-existing time-dependent failures)
- `npm run validate` → PASS (2 non-blocking stale-report warnings)

## Final state (verified after all changes)

- `npm run lint` → PASS
- `npm test` → PASS (915/915 — time-dependent tests fixed)
- `npm run validate` → PASS
- `npm run build` → PASS

---

## Session 1 (earlier — merged)

### Bucket A — dead module removal (verified orphans)

- [x] `src/components/MarketSummaryTicker.js` (215 lines)
- [x] `src/components/internalLinks.js` (86)
- [x] `src/components/nav/dropdown-builders.js` (80)
- [x] `src/lib/freshness-manager.js` (206)
- [x] `src/pages/calculator/value-calculator.js` (54)
- [x] `src/tracker/dom-builders.js` (164)
- [x] `REFACTORING_SUMMARY.md` (root) — stale one-off summary

### Feature fix — SW toast

- [x] `initSwUpdateToast()` import was missing; PWA toast was silently dead

### Bucket B — report hygiene

- [x] Regenerated `reports/seo/governance.json` + `reports/analytics/event-inventory.json`

### Bucket C — further dead module

- [x] `src/utils/slugify.js` (60 lines)

---

## Session 2 (this PR)

### Phase 1 — Dead placeholder page removal

Removed 30 `index.html` placeholder files (each 43 lines, ~1290 lines total) across: `src/`,
`server/`, `config/`, `styles/`, `scripts/`, `data/`, `docs/`, `supabase/`.

### Phase 2 — Dead module & export removal

Deleted files (total ~1305 lines):

- [x] `src/utils/routeBuilder.js` (155 lines)
- [x] `src/routes/routeRegistry.js` (116 lines)
- [x] `src/seo/metadataGenerator.js` (228 lines)
- [x] `src/social/postTemplates.js` (579 lines)
- [x] `src/utils/inputValidation.js` (97 lines)
- [x] `src/utils/routeValidator.js` (106 lines)
- [x] `src/lib/search.js` (24 lines)

Removed dead exports from live files:

- [x] `exportCurrentViewCSV` from `src/lib/export.js`
- [x] `deriveMarketState` from `src/lib/freshness.js`
- [x] `FRESHNESS_PULSE_MIN_INTERVAL_MS` from `src/lib/freshness-pulse.js`
- [x] `buildFilterDropdowns` from `src/pages/shops/filters.js`
- [x] `detailsConfidenceTier`, `isDirectShop`, `loadShortlistFromStorage` from
      `src/pages/shops/helpers.js`

Removed empty directories: `src/routes/`, `src/social/`, `src/utils/`

### Phase 3 — Fix pre-existing test failures

Root cause: `tests/cache-revalidation.test.js` and `tests/provider-failover.test.js` used real
`Date.now()` which fails when market is closed (Friday 21:00+ UTC).

Fix: Added `marketOpenNowFn()` helper that returns time pinned to Wednesday 12:00 UTC, passed as
`nowFn` parameter to `createRealtimePricingEngine`.

Result: **All 915 tests now pass** regardless of day/time.

### Phase 4 — CSS token consolidation

- [x] `styles/pages/home.css`: replaced 6 raw hex values with design token vars
- [x] `styles/pages/calculator.css`: replaced badge-dot hex with `--color-live`
- [x] `styles/pages/developer.css`: replaced 10+ raw hex values with semantic tokens
- [x] Removed dead `styles/partials/market-summary-ticker.css` (165 lines)
- [x] Removed dead `styles/pages/stub.css` (151 lines)
- [x] Removed `@import` for dead partial from global.css

### Phase 5 — Bilingual FAQ for homepage

- [x] Added 7 FAQ Q&A translation keys in English and Arabic to `translations.js`
- [x] Added `localizeFaqItems()` function to `home.js` that renders translated questions/answers
- [x] Arabic users now see properly localized FAQ content

### Phase 6 — Massive dead CSS purge

Total: **~3,311 lines of dead CSS removed**

| File                               | Lines removed | Dead selectors |
| ---------------------------------- | ------------- | -------------- |
| `styles/global.css`                | 2,091         | 241 classes    |
| `styles/pages/tracker-pro.css`     | 202           | 30 classes     |
| `styles/pages/insights.css`        | 265           | 30 classes     |
| `styles/admin.css`                 | 213           | 36 classes     |
| `styles/country-page.css`          | 152           | 9 classes      |
| `styles/pages/shops.css`           | 56            | 11 classes     |
| `styles/guide-page.css`            | 34            | 4 classes      |
| `styles/pages/calculator.css`      | 29            | 4 classes      |
| `styles/pages/content-landing.css` | 25            | 2 classes      |
| `styles/market-page.css`           | 20            | 1 class        |
| `styles/pages/learn.css`           | 14            | 1 class        |
| `styles/pages/developer.css`       | 10            | 2 classes      |

### Phase 7 — SEO JSON-LD improvements

- [x] Added `Article` JSON-LD schema to `insights.html`
- [x] Added `Article` JSON-LD schema to `methodology.html`
- Both pages previously only had BreadcrumbList schema

---

## Summary metrics

| Metric                      | Before         | After   | Change                 |
| --------------------------- | -------------- | ------- | ---------------------- |
| Dead placeholder HTMLs      | 30             | 0       | −30 files              |
| Dead JS modules             | 7              | 0       | −7 files (~1305 lines) |
| Dead CSS rules (global.css) | 241 selectors  | 0       | −2091 lines            |
| Dead CSS rules (page CSS)   | ~130 selectors | 0       | −1220 lines            |
| Dead CSS files              | 2              | 0       | −316 lines             |
| Pre-existing test failures  | 2              | 0       | Fixed                  |
| Homepage FAQ localization   | EN-only        | EN+AR   | Feature                |
| Article JSON-LD schemas     | 0 pages        | 2 pages | SEO                    |
| Total test count            | 915            | 915     | All pass               |

## Documented follow-ups (deliberately NOT touched)

- **`src/learn-hub/` (1265 lines)** — IS wired now (learn.js imports it). Keep.
- **Further CSS consolidation** — home.css has 0 dead classes, well-maintained.
- **Content page accessibility** — generated pages could benefit from lang annotations.
- **Performance audit** — CLS/LCP measurements on generated pages.

## Carve-outs preserved

- Pricing formula, AED peg, troy-ounce constant, karat purity table.
- All canonical URLs, hreflang, sitemap generation.
- No new dependencies, frameworks, or workflow changes.
- No public URL removed.
