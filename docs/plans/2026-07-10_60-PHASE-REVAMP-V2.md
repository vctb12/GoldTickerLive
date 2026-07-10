# 60-Phase Revamp V2 — canonical plan (2026-07-10)

**Basis:** the fresh post-merge master audit (`docs/audits/2026-07-10_POST_MERGE_MASTER_AUDIT.md`)
on integrated `main` (`0b4c378a8`, tag `post-pr-convergence-pre-60-2026-07-10`, backlog 0).
**Backbone:** owner-specified Themes A–J (6 phases each). **Status vocab:** `not-started` · `verify`
(backbone already largely shipped in the convergence — this phase re-verifies + closes gaps, keeps
its number) · `gated-pending-owner-decision`.

**Cross-reference (nothing lost):** prior plans — `docs/REVAMP_PLAN.md`,
`docs/revamp/MASTER-50-PHASE-PLAN.md`, `docs/plans/2026-07-07_30-phase-revamp.md`,
`docs/plans/2026-07-04_product-roadmap.md`, Audit-Waves, and the canonical
`docs/AGENT_MASTER_TRACKER.md` (Sections A–H) — are **incorporated** below. Items already shipped
are marked `verify`; owner-parked items (newsletter #4, WhatsApp #9, Stripe #15) stay
**excluded/gated**; multi-metal/crypto scaffolding is **incorporated** (flags OFF).

**Execution rules (Part V — HELD pending owner confirmation):** one branch + one PR per phase
(`claude/revamp-v2-phase-NN-slug`); isolated worktrees; ≤3 parallel only for file-disjoint phases;
dependency waves (data before product; locale infra before rollout; tokens before visual; feed/API
contracts before integrations; features before release-validation). **Do NOT auto-merge V2 PRs —
hold for owner review.** Every phase: unit + browser + visual validation + rollback. Immutable
invariants (AED 3.6725, troy 31.1035, karat=÷24, spot≠retail, EN/AR+RTL, descriptive-AI-only, no
fabricated data, no secrets, no owner-gated surface without approval) apply to every phase.

Each phase below carries: **Problem · Evidence · In/Out scope · Deps · Files · Risk (data/pricing,
a11y, EN/AR/RTL, perf, SEO) · Flag · Owner-gate · Acceptance · Unit/Browser/Visual tests ·
Rollback.**

---

## THEME A — Canonical pricing & trust (1–6) · anchors audit **F-1 (P0), F-3, F-5**

### A1 — Single canonical spot resolver · not-started · **P0**

- **Problem:** surfaces show different "current" gold prices — tracker/home fetch live
  `api.gold-api.com`/`freegoldapi.com` client-side while calculator uses static
  `/data/gold_price.json` (audit F-1). **Evidence:** 3 spot values same instant (4107.70 / 4108.50 /
  4111.00); network capture.
- **In scope:** one `getCanonicalSpot()` resolver every surface reads (home, tracker, calculator,
  portfolio, compare, heatmap, country, shops, chart); pick source-of-truth deliberately. **Out:**
  changing the hourly workflow (owner-gated); adding new providers.
- **Deps:** none. **Files:** `src/lib/api.js`, `src/components/spotBar.js`, `src/tracker/*`,
  `src/pages/{home,calculator,portfolio}.js`, `src/lib/quote-providers/*`.
- **Risk:** pricing=HIGH (this is the number); a11y/RTL/perf/SEO=low. **Flag:** none.
  **Owner-gate:** the "committed file vs live client API" choice is a product-trust decision —
  surface for owner.
- **Acceptance:** every price surface renders the SAME 24K figure under one fixture at one instant.
- **Unit:** resolver returns one value + one freshness state. **Browser:** cross-surface consistency
  e2e (all surfaces agree). **Visual:** spot identical on home/tracker/calc side-by-side.
- **Rollback:** revert resolver; surfaces fall back to prior per-surface source.

### A2 — Unified freshness/source label bound to the canonical value · verify → extend

- **Problem:** freshness badges exist (F-3) but may label mutually-inconsistent values (F-1).
- **In scope:** freshness state derives from the SAME resolver; one source name; consistent
  Live/Cached/Delayed/Fallback vocab sitewide. **Files:** `src/components/FreshnessBadge.js`,
  `src/lib/freshness.js`. **Acceptance:** badge value == displayed price source, everywhere.
- **Tests:** extend `freshness-labels.spec.js` to assert value↔badge coupling. **Rollback:** revert.

### A3 — Spot-vs-retail separation audit (every surface) · verify

- Reuse F-4 pass; ensure the reference/estimate + retail-differs framing is present and not
  conflated on home/tracker/calc/country/shops/compare/heatmap. **Tests:** extend console/label
  guards.

### A4 — Peg/troy/karat invariant hardening · verify (shipped)

- `pricing-invariants.test.js` + `karat-formula.test.js` + `karatPurity.test.js` already lock these
  (audit F-5 PASS). Phase = keep, add cross-surface AED-derivation assertion (peg not FX).

### A5 — Cross-validation go-live readiness (flag OFF) · gated-pending-owner-decision

- `CROSS_VALIDATION_ENABLED` shipped OFF (#593). Enabling in the production `gold-price-fetch.yml`
  is owner-gated. Phase = docs + a ready-to-enable checklist; no workflow edit.

### A6 — Impossible-price / outlier guardrails · incorporate (flag OFF)

- `STALE_PRICE_GUARD` + `FX_INTEGRITY` shipped OFF (#594/#596). Phase = verify guards + a client
  sanity clamp (reject non-finite/negative/out-of-band before display), test-covered, flag OFF.

## THEME B — Historical data & integrity (7–12)

### B7 — Chart vs spot reconciliation · not-started

- **Problem:** monthly LBMA baseline vs live snapshots must never be presented as exact intraday.
  **Files:** `src/tracker/chart.js`, `src/lib/historical-data.js`. **Acceptance:** chart labels its
  resolution; last point reconciles with the canonical spot (A1). **Browser:** chart-label e2e.

### B8 — Monthly-baseline backfill (real data only) · incorporate

- #589 shipped the backfill mechanism (template ships `price:null`; nulls ignored). Phase = fill
  with REAL LBMA monthly averages (no fabrication), owner provides/points to the source.
  **Owner-gate:** data source.

### B9 — History resolution labeling · verify · B10 — Day-open / prev-close correctness · not-started

### B11 — Freshness hysteresis (flap) verify · verify (#590) · B12 — Degraded/stale/empty data states · not-started (audit gap D)

## THEME C — Multi-metal (13–18) · all pilots OFF, no fabricated data

### C13 — Metals data-layer verify (shipped, flag OFF) · verify (#569/#570/#601–#606, #634)

### C14 — Per-metal freshness view-model verify · verify (#603)

### C15 — Metal+grade selector/URL verify · verify (#604)

### C16 — Multi-metal comparison render verify · verify (#601/#605/#634)

### C17 — Per-metal SEO/JSON-LD verify · verify (#606)

### C18 — Silver/Pt/Pd LIVE go-live · gated-pending-owner-decision

- Blocked on the per-metal feed (fetch script + `gold-price-fetch.yml` must emit XAG/XPT/XPD) — see
  `docs/audits/2026-07-10_multimetal_golive_checklist.md`. **Owner-gate:** feed credentials.

## THEME D — Gold / crypto (19–24) · CRYPTO_PILOT OFF, descriptive-only

### D19 — Crypto plumbing verify (pilot OFF) · verify (#573/#607)

### D20 — Gold-crypto correlation view (descriptive) · verify (#574/#584) — correlation≠causation enforced

### D21 — Crypto data source decision · gated-pending-owner-decision (real BTC/ETH feed; no fabrication)

### D22 — Ratio/volatility framing (no predictions) · not-started · D23 — Disclaimers · verify · D24 — Crypto MVP page (flag OFF) · gated

## THEME E — Localization (25–30)

### E25 — i18n architecture verify · verify (#575) · E26 — FR pilot verify · verify (#576)

### E27 — UR pilot verify · verify (#577) · E28 — HI pilot verify · verify (#616)

### E29 — RTL/`?lang=` correctness · verify (#622/#624 — audit F-8 PASS); extend to any new surface

### E30 — Content-translation policy (noindex-until-reviewed) · verify (#578, #588); next FR/AR batches need linguist review — **owner-gate**

## THEME F — Design / responsive / a11y (31–36) · anchors **F-6, F-9**

### F31 — a11y baseline verify + gaps · verify (#626) + fix `offline.html` missing `<main>` (F-9, P3)

### F32 — Tap-target / WCAG 2.2 verify · verify (#619)

### F33 — Design-token consolidation verify · verify (#595/#597/#635) · F34 — Dark-mode contrast pass (incl. flag-OFF metal/crypto surfaces) · not-started (audit gap)

### F35 — Mobile overflow verify · verify (F-12 PASS) · F36 — Firefox/webkit e2e parity · not-started (F-6): stabilize `tracker-flow.spec.js` waits or document support matrix

## THEME G — Core product (37–42)

### G37 — Calculator handoff verify · verify (#637 fix) · G38 — Calculator UX/localized-input (flag OFF) · incorporate (#600)

### G39 — Portfolio persistence + P/L math audit · not-started (audit gap — multi-holding fixtures) · G40 — Compare per-country reconciliation vs A1 · not-started (audit gap)

### G41 — Heatmap per-country reconciliation vs A1 · not-started (audit gap) · G42 — Country/price responsive QA · not-started

## THEME H — Content / directory / SEO (43–48)

### H43 — SEO head/canonical/hreflang verify · verify (#627, audit F-10) · H44 — Structured data (glossary DefinedTermSet etc.) · verify (#613)

### H45 — Shops directory data honesty · verify (#564) + spot-vs-retail guidance (#636) · H46 — Sitemap/robots hygiene · verify

### H47 — Internal linking / pSEO · not-started · H48 — Landing pages (UAE/Dubai/24K/22K) · not-started (docs specs exist; gated on live feed for metals)

## THEME I — Distribution / monetization (49–54) · mostly owner-gated

### I49 — Analytics events (privacy-conscious) · gated-pending-owner-decision (analytics OAuth) — also fold F-1's third-party-fetch privacy note

### I50 — RSS/JSON public feed (client $0 parts)  ·  not-started · I51 — Embed widget configurator ($0 frontend) · not-started

### I52 — Newsletter · **excluded** (owner-removed, Roadmap #4) · I53 — Social automation · gated (app approvals/workflows) · I54 — Premium tier / public API · gated (billing RED zone)

## THEME J — PWA / security / ops / release (55–60) · anchors **F-13**

### J55 — PWA hardening verify · verify (#579, #629) · J56 — Web push · gated (`sw.js` owner-gated)

### J57 — Security & privacy review · not-started — client third-party fetch inventory (F-1 note: gold-api/freegoldapi/Supabase/GA/Clarity/DoubleClick), CSP, exposed keys

### J58 — **Branch protection (F-13)** · gated-pending-owner-decision — enable required checks (CI quality + Playwright) + block direct main pushes. **Owner decision; repo settings not changed by agent.**

### J59 — Secrets/workflow governance verify · verify (#618 deny-list audited) · J60 — Release/rollback + observability verify · verify (#567); regression gate green before any release

---

## Old-plan reconciliation (explicit)

| Prior plan                              | Disposition                                                                                             |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 30-Revamp (1–30, #537–#567)             | **incorporated** as `verify` phases across A–J                                                          |
| Continuation 31–46 (#568–#583)          | **incorporated** (metals/crypto/i18n/PWA/white-label)                                                   |
| 50-Phase Master Plan                    | **incorporated**; overlaps mapped; no double-execution                                                  |
| Audit Waves 0–7                         | **incorporated** (strategic grouping of the above)                                                      |
| Product Roadmap (21 items)              | #4 newsletter **excluded**; #9 WhatsApp / #15 Stripe **excluded (parked)**; rest mapped to I/J or gated |
| This run's DP-1…14 + convergence guards | **incorporated** as the `verify` backbone (browser guards already enforce many acceptance criteria)     |

**Nothing deleted.** Prior plan docs remain in `docs/`; this file is the forward canonical plan.

## Immediate priority order (for owner approval of Part V)

1. **A1–A2 (F-1 P0)** — canonical spot + coupled freshness. 2. **A6/B12** — outlier + degraded
   states.
2. **F34/F36/F31(F-9)** — dark-mode + browser parity + offline `<main>`. 4. **G39–G41** —
   portfolio/compare/heatmap number reconciliation. Owner-gated (A5, B8, C18, D21, I49/53/54, J56,
   **J58 branch protection**) await decisions.
