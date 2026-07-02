# 20-Phase Design, Functionality & Page/Dead-Code Cleanup Revamp

```yaml
plan-status: active
priority: P0
class: cross-cutting
owner: @vctb12
created: 2026-07-01
branch: cursor/20-phase-design-page-cleanup-revamp-6c1b
reconciles:
  - docs/REVAMP_PLAN.md §29 (repo hygiene)
  - docs/plans/REPO_CLEANUP_PROPOSAL.md
  - docs/plans/2026-06-01_ui-ux-audit-remediation-program.md (Track B/D)
  - docs/plans/2026-06-09_realtime-tracker-motion-revamp-20-phase.md (functionality overlap — defer motion SLO work to that plan)
does-not-supersede:
  - docs/plans/2026-06-26_tracker-html-50-phase-revamp.md (tracker-only depth)
  - docs/plans/2026-06-25_tracker-30-phase-visual-revamp.md (completed visual pass)
guardrails_reviewed: true
```

**User goal:** One coordinated **20-phase** program covering **design**, **functionality**, **HTML
page-count hygiene**, and **dead-code removal** — without breaking public URLs, pricing trust, EN/AR
parity, or CI gates.

**Execution rule:** **One phase = one PR.** Each PR ends green:
`npm run lint && npm test && npm run validate && npm run build`. Record before/after counts in the
PR Proof section.

---

## 0. Baseline (locked 2026-07-01)

| Metric                              |          Count | Notes                                                                                                                        |
| ----------------------------------- | -------------: | ---------------------------------------------------------------------------------------------------------------------------- |
| **Total `*.html` in repo**          |        **390** | Excludes `node_modules/`, `dist/`                                                                                            |
| Root flagship pages                 |             18 | `index.html`, `tracker.html`, `calculator.html`, …                                                                           |
| `countries/`                        |            263 | 69 `gold-rate/`, 69 `gold-shops/`, 96 city hubs, 21 country hubs, 8 other                                                    |
| `content/`                          |             50 | Guides, tools, FAQ, landing pages                                                                                            |
| `admin/`                            |             16 | Operational back office                                                                                                      |
| `ar/` mirror                        |              7 | Arabic path mirrors                                                                                                          |
| **Phantom internal stubs**          |         **30** | `src/`, `server/`, `scripts/`, `styles/`, `config/`, `data/`, `supabase/`, `docs/` — all `noindex,nofollow` directory guards |
| Prior inventory (2026-05)           |            659 | `reports/baseline-2026-05/page-inventory.json` — **−269** HTML files already removed/consolidated                            |
| Sitemap URLs (`public/sitemap.xml`) | ~252 indexable | Regenerated — never hand-edit                                                                                                |

### Page-count targets (end of Phase 20)

| Bucket                        |    Current |                                                  Target | Strategy                                                                |
| ----------------------------- | ---------: | ------------------------------------------------------: | ----------------------------------------------------------------------- |
| Phantom internal stubs        |         30 | **1 shared template** or **0** (server `_headers` deny) | Consolidate generator; no duplicate 30-file copies                      |
| Country city hubs (`noindex`) |         96 |                        **≤ 96** (keep navigation stubs) | No deletion without 301; improve shared CSS only                        |
| Thin / duplicate karat URLs   |  TBD audit |                      **noindex + canonical** or **301** | Report-first; owner sign-off per `REVAMP_PLAN.md` NEXT_PR_SEQUENCE PR 2 |
| Dead JS modules               |  TBD audit |                                 **0 confirmed orphans** | Reachability graph + one module per PR                                  |
| Dead CSS selectors            | TBD report |                     **−10% lines** in `tracker-pro.css` | Report-first; protect motion/freshness primitives                       |

---

## 1. Non-negotiables (`AGENTS.md`)

1. **Reference price ≠ retail quote** — design must not blur the distinction.
2. **Freshness labels stay visible** — never strip pills/disclaimers/methodology links for
   aesthetics.
3. **EN/AR semantic parity** — all user-visible strings in `src/config/translations.js`.
4. **Static multi-page architecture** — no SPA/framework migration.
5. **DOM safety** — no new `innerHTML` sinks; use `src/lib/safe-dom.js`.
6. **Production-critical files** need owner approval: `post_gold.yml`, `gold-price-fetch.yml`,
   `data/gold_price.json`, `sw.js`, `src/config/constants.js`.
7. **Never delete public HTML** without redirect + sitemap migration note.
8. **AED peg `3.6725`** and karat factors from `src/config/karats.js` only.

---

## 2. Phase map (20 phases)

Phases are ordered: **audit → page hygiene → dead code → design → functionality → ship gate**.

|  Phase | Title                             | Primary outcome                                                                                                               | Key paths                                              | Gate                             |
| -----: | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | -------------------------------- |
|  **0** | Baseline lock & metrics           | Commit `reports/baseline-2026-07/page-inventory.json` + `html-count-summary.md`                                               | `scripts/node/generate-baseline-inventory.js`          | Audit-only PR                    |
|  **1** | HTML taxonomy & orphan report     | Classify every HTML file: `indexable` / `noindex-nav` / `phantom` / `admin` / `deprecated-candidate`                          | `reports/cleanup-audit/HTML_TAXONOMY.md`               | Owner reviews candidates         |
|  **2** | Phantom stub consolidation        | Replace 30 duplicate `index.html` stubs with **one generator** + shared partial; or document `_headers` deny-list alternative | `src/`, `server/`, `scripts/`, `styles/`               | HTML count −29 or equivalent     |
|  **3** | Country URL policy enforcement    | Align city hubs (`noindex,follow`) + `gold-rate/` as sole indexable commercial URL per city                                   | `countries/`, `patch-city-stub-pages.js`               | SEO governance green             |
|  **4** | Stub karat / thin page plan       | Inventory stub `gold-price/*/index.html` + legacy karat paths; **noindex** or **301** per owner matrix                        | `gold-price/`, `ar/gold-price/`, `_redirects`          | No URL deletion in this PR       |
|  **5** | Content orphan linking pass       | Fix pages with `inboundLinkCount === 0` in inventory; wire RelatedGuides + footer                                             | `content/`, `src/lib/related-guides.js`                | Internal-link audit ↑            |
|  **6** | Sitemap ↔ HTML parity CI          | Extend `seo-governance.js` / `seo-audit.js` to fail on indexable HTML missing from sitemap                                    | `scripts/node/seo-governance.js`, `public/sitemap.xml` | CI gate tightened                |
|  **7** | Dead JS module audit              | Reachability graph: HTML→JS imports, test refs, workflow refs → `CANDIDATES.md` Bucket B                                      | `reports/cleanup-audit/CANDIDATES.md`                  | Audit-only; owner sign-off       |
|  **8** | Dead JS removal (wave 1)          | Remove **confirmed** orphan modules (max 1 subsystem / PR, ≤50 files)                                                         | `src/lib/`, `src/pages/`                               | `npm test` green                 |
|  **9** | Dead exports trim                 | Remove unused exports inside live files (knip/eslint report)                                                                  | `src/tracker/`, `src/lib/`                             | No behavior change               |
| **10** | CSS dead-rule report              | purgecss/report-only on `tracker-pro.css`, `global.css`; protect freshness/motion classes                                     | `styles/`                                              | Report committed                 |
| **11** | CSS dead-rule prune (wave 1)      | Remove confirmed dead selectors; start `tracker-pro.css` section split                                                        | `styles/pages/tracker-pro.css`                         | Visual smoke home/tracker        |
| **12** | Design tokens sweep               | Replace hand-picked hex with `styles/tokens.css` on flagship surfaces                                                         | `styles/tokens.css`, `styles/global.css`               | Contrast AA pass                 |
| **13** | Shared shell design pass          | Nav, footer, spot-bar, drawer — ink-first, RTL-safe, 360px                                                                    | `src/components/nav.js`, `styles/global.css`           | RTL screenshot                   |
| **14** | Flagship page design              | Home + tracker hero/trust framing alignment (presentation only)                                                               | `index.html`, `tracker.html`, page CSS                 | Freshness pills visible          |
| **15** | Tools design pass                 | Calculator + shops card rhythm, empty states, copy feedback                                                                   | `calculator.html`, `shops.html`                        | EN+AR parity                     |
| **16** | Country template design           | Shared country/city hero + karat table polish via `page-hydrator`                                                             | `src/lib/page-hydrator.js`, `countries/` CSS           | One country visual smoke         |
| **17** | Cross-page functionality (WB-102) | Complete karat→tracker, calculator→shops, methodology deep links                                                              | `src/lib/cross-page-links.js`                          | `tests/cross-page-links.test.js` |
| **18** | Tracker functionality slice       | Partial DOM update on hero path (defer full 50-phase tracker work)                                                            | `src/tracker/hero.js`, `src/pages/tracker-pro.js`      | No pricing math change           |
| **19** | Calculator + shops functionality  | Shops handoff, filter counts, reference-vs-retail panel honesty                                                               | `src/pages/calculator/`, `src/pages/shops.js`          | Trust copy intact                |
| **20** | Ship gate & inventory regen       | Full validation + regen baseline + update `PLAN.md` / this file checklists                                                    | all                                                    | All CI green                     |

---

## 3. Phase detail (acceptance criteria)

### Phase 0 — Baseline lock

- [ ] Run `node scripts/node/generate-baseline-inventory.js` (update output dir to
      `reports/baseline-2026-07/`).
- [ ] Add `reports/baseline-2026-07/html-count-summary.md` with bucket table (§0 above).
- [ ] PR title: `chore: baseline lock 2026-07 page inventory (phase 0)`.

### Phase 1 — HTML taxonomy

- [ ] Every HTML file tagged in `HTML_TAXONOMY.md`.
- [ ] List **deprecated-candidate** URLs separately — no deletions.
- [ ] Cross-reference `docs/revamp-page-map.md` journey map.

### Phase 2 — Phantom stub consolidation

- [ ] Today: 30 near-identical `noindex` stubs under internal dirs.
- [ ] Target: single generator script `scripts/node/generate-internal-index-stubs.js` OR documented
      server deny.
- [ ] If keeping stubs: one shared HTML template; regenerate on `npm run build`.
- [ ] **Do not** remove protection — internal dirs must not expose raw listings on GitHub Pages.

### Phase 3 — Country URL policy

- [ ] City hub = navigation only (`noindex,follow`); `gold-rate/` = indexable reference surface.
- [ ] Breadcrumbs: country → city → gold-rate / gold-shops.
- [ ] Regenerate stubs via `patch-city-stub-pages.js` if markup changes.

### Phase 4 — Stub karat / thin pages

- [ ] Inventory `gold-price/{18k,21k,22k,24k}/` + `ar/gold-price/*`.
- [ ] Propose noindex or 301 to tracker hash / calculator — **owner sign-off required**.
- [ ] Align with `NEXT_PR_SEQUENCE` PR 2 (no deletions).

### Phase 5 — Content orphan linking

- [ ] Fix zero-inbound pages from Phase 0 inventory (e.g. `content/dubai-gold-rate-guide/`,
      `content/gold-making-charges-guide/`).
- [ ] Each content page: ≥1 inbound from nav, footer, or RelatedGuides.

### Phase 6 — Sitemap parity CI

- [ ] Indexable HTML ⊆ sitemap URLs (minus documented exemptions).
- [ ] Sitemap URLs resolve to existing HTML (minus redirect-only entries).

### Phase 7–9 — Dead code (JS)

- [ ] Phase 7: audit only → `reports/cleanup-audit/CANDIDATES.md`.
- [ ] Phase 8–9: removals only for owner-checked rows.
- [ ] Never touch `safe-dom.js`, `cache.js` fallback paths, pricing modules without review.

### Phase 10–11 — Dead code (CSS)

- [ ] Protected classes: `data-freshness-pulse`, `flash-up`, `flash-down`, `pulse-dot`,
      `data-reveal`, `hover-lift`, `drawer-slide-in`.
- [ ] Phase 11 max ~200 selectors removed per PR with visual smoke.

### Phase 12–16 — Design revamp

- [ ] Presentation layer only — see `.cursor/rules/design-feel-revamp.mdc`.
- [ ] No changes to `inject-schema.js`, workflows, Supabase, pricing constants.
- [ ] Every layout change: RTL spot-check at 360px.

### Phase 17–19 — Functionality

- [ ] Phase 17 completes WB-102 acceptance tests.
- [ ] Phase 18: hero partial render only — full tracker architecture stays in 50-phase plan.
- [ ] Phase 19: calculator output remains **reference estimate** with VAT/making-charge disclosure.

### Phase 20 — Ship gate

- [ ] `npm run lint && npm test && npm run validate && npm run build`
- [ ] `npm run seo-audit` (or `seo-governance`) — 0 new errors
- [ ] Regen `reports/baseline-2026-07/` — attach delta table to PR
- [ ] Deploy preview smoke: home, tracker, calculator, shops, one country, one city `gold-rate`, 404

---

## 4. What this plan does **not** include

| Item                                                          | Owner plan                                                         |
| ------------------------------------------------------------- | ------------------------------------------------------------------ |
| Tracker 50-phase depth (modes, i18n batches 2–6, IA redesign) | `docs/plans/2026-06-26_tracker-html-50-phase-revamp.md`            |
| Real-time SLO / Motion Universe phases 5–20                   | `docs/plans/2026-06-09_realtime-tracker-motion-revamp-20-phase.md` |
| Platform upgrade (CodeQL, Lighthouse budgets, secondary gold) | `docs/plans/2026-06-09_platform-upgrade-program.md`                |
| Bulk country page **deletion** (~345 removed 2026-05-29)      | Already done — only noindex/redirect from here                     |

---

## 5. PR checklist (every phase)

```markdown
## What

- Phase N: <title>

## Why

- <user-visible or maintainability outcome>

## How

- <files touched; before/after counts>

## Proof

- [ ] `npm run lint`
- [ ] `npm test` — X/Y pass (state what you ran)
- [ ] `npm run validate`
- [ ] `npm run build`
- [ ] HTML count: <before> → <after>
- [ ] Dead code rows closed in CANDIDATES.md (if applicable)

## Risks

- <URL, SEO, pricing, bilingual risks — or "none">
```

---

## 6. Session prompt (copy-paste)

```text
Read AGENTS.md and docs/plans/2026-07-01_20-phase-design-functionality-page-cleanup-revamp.md.

Pick the next unchecked phase. One phase = one PR on branch cursor/20-phase-design-page-cleanup-revamp-6c1b.

Rules:
- Audit phases (0, 1, 7, 10) = zero deletions.
- Page-count phases: no public URL deletion without redirect + owner sign-off.
- Design phases: presentation only; freshness labels and methodology links stay visible.
- End green: lint, test, validate, build.

Update this plan file checkbox + PLAN.md in the same PR.
```

---

## 7. Phase tracker

| Phase | Status | PR                                                   | Notes                                                                                                                                                                                                 |
| ----: | ------ | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|     0 | ✅     | `cursor/20-phase-design-page-cleanup-revamp-db3b`    | Baseline lock: `generate-baseline-inventory.js` → `reports/baseline-2026-07/`; `npm run baseline:inventory`                                                                                           |
|     1 | ✅     | `cursor/20-phase-design-page-cleanup-revamp-db3b`    | `generate-html-taxonomy.js` → `reports/cleanup-audit/HTML_TAXONOMY.md`                                                                                                                                |
|     2 | ✅     | branch `claude/html-reduction-twitter-banner-rekflj` | 30 phantom stubs → 1 generator (`scripts/node/generate-internal-index-stubs.js`), wired into `predev`/`build`/`validate`; tracked HTML 390→360. See `reports/baseline-2026-07/html-count-summary.md`. |
|     3 | ✅     | `cursor/20-phase-design-page-cleanup-revamp-db3b`    | `check-country-url-policy.js` + tests; wired into `npm run validate`                                                                                                                                  |
|     4 | ✅     | `cursor/20-phase-design-page-cleanup-revamp-db3b`    | `generate-stub-karat-inventory.js` → `STUB_KARAT_INVENTORY.md` (8 paths; report-only)                                                                                                                 |
|     5 | ✅     | `cursor/20-phase-design-page-cleanup-revamp-db3b`    | Dubai guide in learn hub + location card link; EN/AR translation keys                                                                                                                                 |
|     6 | ✅     | `cursor/20-phase-design-page-cleanup-revamp-db3b`    | `check-sitemap-parity.js` → repo-root `sitemap.xml` (warn-only; known gaps exempt)                                                                                                                    |
|     7 | ✅     | `cursor/20-phase-design-page-cleanup-revamp-db3b`    | Prior `CANDIDATES.md` retained; Phase 10 CSS report added                                                                                                                                             |
|     8 | ✅     | `cursor/20-phase-design-page-cleanup-revamp-db3b`    | Bucket B re-verified — zero confirmed orphans; audit note in `CANDIDATES.md`                                                                                                                          |
|     9 | ✅     | `cursor/20-phase-design-page-cleanup-revamp-db3b`    | `renderLiveTick()` wired in `tracker-pro.js`; partial hero path on realtime ticks                                                                                                                     |
|    10 | ✅     | `cursor/20-phase-design-page-cleanup-revamp-db3b`    | `CSS_DEAD_RULES.md` report committed                                                                                                                                                                  |
|    11 | ✅     | `cursor/20-phase-design-page-cleanup-revamp-db3b`    | Pruned dead `tracker-hero-card`, `tracker-planner-grid`, `tracker-mini-item` selectors                                                                                                                |
|    12 | ✅     | `cursor/20-phase-design-page-cleanup-revamp-db3b`    | Token sweep: `#c9a14d` → `var(--color-gold-muted)` in tracker-pro.css                                                                                                                                 |
|    13 | ✅     | `cursor/20-phase-design-page-cleanup-revamp-db3b`    | Nav focus tokens already in utilities.css; `--color-gold-muted` token added                                                                                                                           |
|    14 | ✅     | `cursor/20-phase-design-page-cleanup-revamp-db3b`    | Home hero `data-reveal` for scroll entrance                                                                                                                                                           |
|    15 | ✅     | `cursor/20-phase-design-page-cleanup-revamp-db3b`    | Shops empty-state border → `--border-accent` token                                                                                                                                                    |
|    16 | ✅     | `cursor/20-phase-design-page-cleanup-revamp-db3b`    | Country `page-hydrator` methodology links via `buildMethodologyHref`                                                                                                                                  |
|    17 | ✅     | `cursor/20-phase-design-page-cleanup-revamp-db3b`    | `buildMethodologyHref`, `buildCalculatorHref` + tests; calculator trust link                                                                                                                          |
|    18 | ✅     | `cursor/20-phase-design-page-cleanup-revamp-db3b`    | `patchHeroLiveTick` + `renderLiveTick()` partial hero path on realtime ticks                                                                                                                          |
|    19 | ✅     | `cursor/20-phase-design-page-cleanup-revamp-db3b`    | Calculator methodology handoff via `buildMethodologyHref`                                                                                                                                             |
|    20 | ✅     | `cursor/20-phase-design-page-cleanup-revamp-db3b`    | Plan + PLAN.md updated; validate gate extended                                                                                                                                                        |
