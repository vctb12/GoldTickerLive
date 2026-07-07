# Gold Ticker Live — 30-Phase Revamp Program (2026-07-07)

```yaml
plan-status: in-progress
priority: P0
created: 2026-07-07
owner: repo-owner (vctb12)
executor: claude-code
branch-strategy: one isolated branch + one PR per phase (NO merge; owner reviews/merges)
gate: npm run validate && npm test must stay fully green on every phase
baseline: validate exit 0; npm test 1286 pass / 0 fail (2026-07-07, origin/main @ ba7c02c)
rollback-tag: pre-revamp-baseline-2026-07-07
```

This is the canonical plan for the owner-supplied 30-phase revamp. It is **distinct from and does
not duplicate**:

- `docs/revamp/MASTER-50-PHASE-PLAN.md` (the 50-phase tracker/site program)
- `docs/audits/MASTER_GOLDTICKERLIVE_WEBSITE_AUDIT_AND_20_PHASE_PLAN.md` (20-phase audit plan)
- `docs/plans/2026-07-04_product-roadmap.md` (17-item product roadmap)

Where scope would overlap those, this program **reconciles rather than redoes**. Live-site findings
feeding this plan: `docs/revamp/00-AUDIT.md` (2026-06-30 in-browser audit).

---

## Immutable invariants (never change)

1. **AED peg:** 1 USD = **3.6725** AED — fixed, hardcoded in `src/config/constants.js`. Never
   changed by any phase.
2. **Troy ounce:** **31.1034768 g** — immutable.
3. **Reference, not retail:** every price surface must be labelled a **spot-linked
   bullion-equivalent estimate**, never a guaranteed retail/shop quote. Reference ≠ retail
   separation must remain explicit and must never be removed "to look cleaner".
4. **X automation is out of scope & production-critical:** the hourly `@GoldTickerLive` X-posting
   automation (`post_gold.yml`) and price fetch (`gold-price-fetch.yml`) are **owner-gated**. No
   phase touches them.
5. **Freshness honesty:** `live` / `updated` / `cached` / `delayed` / `stale` / `fallback` /
   `unavailable` are used per `docs/freshness-contract.md`. Never call non-live data "live".
6. **EN/AR semantic parity:** strings live in `src/config/translations.js`; no stronger claim in one
   language.

## Hard constraints (never violate)

- **$0-to-run:** no new recurring costs; no paid services introduced.
- **Parked — leave parked:** newsletter automation, WhatsApp Business API alerts, Stripe payments.
  Do not resurrect any of them.
- **Owner-gated files — audit/recommend only, NEVER modify:**
  `.github/workflows/gold-price-fetch.yml`, `.github/workflows/post_gold.yml`, `sw.js`, any billing
  config, Supabase RLS / signup config.
- **No production database writes:** Supabase migrations may be authored **as files** but must NOT
  be applied/run against the live project. That requires separate explicit owner go-ahead.
- **In-flight PRs — reconcile, don't collide:**
  - **PR #536** (`claude/price-display-css-phase-3-n4s409`) — sitemap → `public/sitemap.xml`,
    hreflang model shifts to `?lang=ar`. Phase 12 rebases/reconciles on top; does not duplicate.
  - **PR #535** (`claude/product-roadmap-implementation-4oopr4`) — calculator preset/label + shops &
    calculator density. Phases 5/6/23/27 keep clear of its exact edits (scope by concern).
- **Owner-gated / irreversible / high-risk:** if a phase genuinely requires one, **do not do it** —
  write the recommendation into the PR/report and move to the next phase.

## Per-phase workflow

1. Branch: `claude/revamp-phase-NN-slug` off latest `main`.
2. Implement **only** that phase's scope. Never touch owner-gated files. Prefer minimal diffs.
3. Gate: `npm run validate` + `npm test` stay green (plus `npm run build` for HTML/CSS/JS changes).
4. Commit with a clear message; push `-u origin <branch>`.
5. Open a PR (no merge) with **What / Why / Files / Tests / Risk / Manual QA**.
6. Move to the next phase. Concise owner update every few phases.

Legend: 🟢 Green = safe to implement · 🟡 Yellow = flagged / owner-gate before enabling live / gated
behind visual-regression or feature flag.

---

## Phase map (Tracks A–H)

### Track A — Baseline & Audit

| #   | Color | Scope                                         | Key outputs                                                                                                                             |
| --- | ----- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 🟢    | Baseline & rollback fences                    | this plan, `docs/AGENT_PHASE_INDEX.md`, `reports/qa/` console/a11y baseline harness + capture, rollback tag                             |
| 2   | 🟢    | Runtime error audit (register only, no fixes) | defect register for compare/heatmap/portfolio/tracker/calculator EN+AR                                                                  |
| 3   | 🟢    | Dependency/security/secrets audit             | `npm audit`, CodeQL/Dependabot review, RLS read-only re-verify, env-vs-`.env.example` diff, CSP dry-run inventory → `reports/security/` |
| 4   | 🟢    | Data-source resilience audit                  | provider primary/fallback/cached state diagram + staleness thresholds                                                                   |

### Track B — Data Trust (highest priority)

| #   | Color | Scope                                                                                                                            |
| --- | ----- | -------------------------------------------------------------------------------------------------------------------------------- |
| 5   | 🟢    | Spot-vs-retail hardening across all price surfaces; shops separates shop-quoted retail from spot                                 |
| 6   | 🟢    | Unified freshness/fallback labeling — **fix** shops sticky top price-bar (offline/dashes) vs live ticker; single snapshot source |
| 7   | 🟢    | Methodology as source of truth — verify formulas match code (no math change); deep-links from every tool                         |
| 8   | 🟡    | Secondary gold cross-validation — divergence detection behind a feature flag; owner gate to enable live; no peg/troy change      |

### Track C — Technical SEO

| #   | Color | Scope                                                                                                       |
| --- | ----- | ----------------------------------------------------------------------------------------------------------- |
| 9   | 🟢    | Metadata & canonical audit + favicon/app-icon/OG-Twitter image fix (home/tracker/calc/shops/country sample) |
| 10  | 🟢    | hreflang & bilingual SEO — reciprocal hreflang + x-default; lang/dir attrs (reconcile PR #536 model)        |
| 11  | 🟢    | Structured data — BreadcrumbList, ItemList (shops), FAQPage, Article (learn)                                |
| 12  | 🟢    | Sitemap gap closure — reconcile PR #536; robots.txt references sitemap; zero noindex URLs                   |
| 13  | 🟢    | Internal linking & crawl — breadcrumb consistency, orphan detection, contextual cross-links                 |

### Track D — Performance

| #   | Color | Scope                                                                                                 |
| --- | ----- | ----------------------------------------------------------------------------------------------------- |
| 14  | 🟢    | Core Web Vitals (LCP/CLS/INP) vs `budget.json`/`lighthouserc.json`; repeatable `scripts/perf/` report |
| 15  | 🟢    | Asset & image pipeline — webp/avif, srcset, explicit width/height, lazy-load, size-delta report       |
| 16  | 🟡    | JS delivery + SW caching — code-split/defer; `sw.js` read-only recommend; lazy-load Leaflet           |

### Track E — Design System & Shell

| #   | Color | Scope                                                                                                                |
| --- | ----- | -------------------------------------------------------------------------------------------------------------------- |
| 17  | 🟡    | Design-token consolidation — hex → tokens; dual-theme parity via visual regression                                   |
| 18  | 🟢    | Global shell & navigation — wire nav search to bilingual search; header/footer/skip-link consistency                 |
| 19  | 🟢    | Accessibility conformance — axe-core Playwright; WCAG AA contrast (dual-theme + gold ramps); keyboard/focus/ARIA     |
| 20  | 🟢    | RTL & bilingual polish — directional CSS → logical props; Arabic typography/number/date; RTL numeric table alignment |

### Track F — Per-Page UX

| #   | Color | Scope                                                                                                                               |
| --- | ----- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 21  | 🟡    | Homepage overhaul — hero/ticker/price hierarchy/trust above fold; visual-regression gated                                           |
| 22  | 🟡    | Tracker polish — real-time integrity, interval cleanup, no leaks; in-place edits only (99 KB)                                       |
| 23  | 🟢    | Calculator UX — 5 tabs polish, input validation, result labeling; export/share (copy/CSV/print) with timestamp/freshness/disclaimer |
| 24  | 🟢    | Compare tool — clarity, mobile, schema; in-place edits only (74 KB)                                                                 |
| 25  | 🟢    | World heatmap — legend, deep links, keyboard nav, table fallback                                                                    |
| 26  | 🟢    | Portfolio — honest gain rules preserved, valuation labeling, export/restore reliability + fixture, empty states                     |
| 27  | 🟡    | Shops directory — map/card redesign, filter UX, ItemList schema, data-quality badges                                                |

### Track G — Content & Growth

| #   | Color | Scope                                                                                                                                                             |
| --- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 28  | 🟢    | Learn hub & glossary — Article schema, cross-linking, stable anchors EN/AR + tooltip deep-links; `scripts/content/` quality lint                                  |
| 29  | 🟡    | Additive growth — approved-lane items behind flags (embeddable widget, RSS/JSON feed, CSV export parity); no billing/owner-gated; owner gate on backend-dependent |

### Track H — Launch

| #   | Color | Scope                                                                                                                                                                                                |
| --- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 30  | 🟢    | Regression/rollout/observability — full green suite, visual regression EN/AR both themes vs Phase-1 baseline, failure notifications, `docs/qa/release-smoke-matrix.md`, rollback plan + 48–72h watch |

---

## PR ledger

Updated as each phase ships. `PR` links added on push.

| Phase | Branch                            | PR  | Status      |
| ----- | --------------------------------- | --- | ----------- |
| 1     | `claude/revamp-phase-01-baseline` | —   | in progress |

```
<!-- phases 2-30 appended as they ship -->
```
