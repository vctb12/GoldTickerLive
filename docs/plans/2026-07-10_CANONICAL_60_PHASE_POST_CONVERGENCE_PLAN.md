# Canonical 60-Phase Post-Convergence Plan — 2026-07-10

**Basis:** `docs/audits/2026-07-10_POST_CONVERGENCE_MAIN_AUDIT.md` on integrated `main`
(`eb246dea9`, tag `post-pr-convergence-pre-60-2026-07-10`, backlog 0). **Sequencing:**
risk-reduction FIRST — groups 1–2 (stabilize + pricing integrity, incl. the P0 F-1 fix) precede all
scope-adding groups. **Status is HELD:** Part V execution has NOT started; no dormant activation; no
fabricated data; monetization not live without explicit owner approval.

**PR naming convention:** `revamp2/gNN-pMM-slug` (group NN, phase MM). One PR per phase.
**Definition of Done (every phase):** objective met · in-scope only · unit + browser (Chromium min)

- visual/validation as noted · lint/format/validate/build green · invariants intact (AED 3.6725,
  troy 31.1035, karat=÷24, spot≠retail) · flags/pilots unchanged unless the phase's explicit purpose
  · EN/AR + RTL verified where UI · rollback documented · PR held for owner review (no auto-merge).
  **Parallelism:** ≤3 concurrent, only file-disjoint phases; serial where a dependency or shared
  file exists (marked **[serial]** / **[parallel-ok]**).

Per phase: **Obj · Scope · Out · Files · Tests · Risk · Flag/Gate · Owner-decision · PR-size ·
Accept.**

---

## GROUP 1 — Stabilization & correctness [do first; mostly serial on shared infra]

**P1 · Canonical spot resolver foundation** [serial] — **Obj:** one `getCanonicalSpot()` module
(value

- freshness) as the single read point. **Scope:** new resolver + adapters over existing sources.
  **Out:** changing which source wins (P2), workflow edits. **Files:** `src/lib/api.js`, new
  `src/lib/spot-resolver.js`. **Tests:** unit (one value/one state). **Risk:** HIGH (pricing).
  **Flag/Gate:** none. **Owner:** no. **PR:** M. **Accept:** resolver returns a single canonical
  `{spot, freshness, source}`.

**P2 · Choose + enforce source of truth (fixes F-1 P0)** [serial, dep P1] — **Obj:** every surface
reads the resolver; kill divergent live-vs-file rendering. **Scope:**
home/tracker/calculator/portfolio/ compare/heatmap/country/shops/chart wired to P1. **Out:** new
providers. **Files:** `src/components/spotBar.js`, `src/tracker/*`, `src/pages/*`. **Tests:**
cross-surface consistency e2e (all agree under one fixture). **Risk:** HIGH. **Flag/Gate:** none.
**Owner:** **YES — committed-file vs live-API canonical choice.** **PR:** L. **Accept:** identical
24K figure on every surface at one instant.

**P3 · Client third-party fetch inventory + gating** [parallel-ok] — **Obj:** document/guard client
calls to gold-api/freegoldapi/Supabase/GA/Clarity/DoubleClick (F-1 privacy note). **Scope:**
inventory + a consent/gate seam (no removal without owner). **Files:** `src/lib/api.js`, analytics
loaders. **Tests:** console-clean guard extension. **Risk:** med. **Gate:** analytics = owner.
**PR:** M.

**P4 · `offline.html` `<main>` landmark (F-9)** [parallel-ok] — **Obj:** add `<main>`. **Files:**
`offline.html`. **Tests:** extend a11y-baseline to cover offline. **Risk:** low. **PR:** S.
**Accept:** offline has one `<main>`.

**P5 · Firefox/webkit e2e stability (F-6)** [parallel-ok] — **Obj:** de-flake tracker-flow under
parallel load OR formalize chromium-only CI scope with a documented reason. **Files:**
`tests/e2e/tracker-flow.spec.js`, `playwright.config.js`. **Tests:** repeat-each stability.
**Risk:** low (test-only). **PR:** S.

**P6 · Regression-guard consolidation** [parallel-ok] — **Obj:** dedupe e2e fixtures/ports/helpers
from the convergence guard suite; keep runtime acceptable. **Files:** `tests/e2e/*`. **Risk:** low.
**PR:** M.

## GROUP 2 — Data integrity & pricing architecture [dep group 1; serial on pricing]

**P7 · Unified freshness vocab bound to canonical value** [serial, dep P2] —
Live/Cached/Delayed/Fallback consistent + value↔badge coupling. **Files:** `FreshnessBadge.js`,
`freshness.js`. **Tests:** freshness e2e. **Risk:** med. **PR:** M. **P8 · Outlier /
impossible-price clamp (verify #594/#596 OFF)** — reject non-finite/negative/out-of-band before
display; flag OFF. **Files:** `src/lib/*`. **Tests:** unit. **Gate:** enable=owner. **PR:** M. **P9
· Degraded/stale/empty/offline data states** — labeled states on every price surface. **Tests:** e2e
per state. **Risk:** med. **PR:** M. **P10 · Chart vs spot reconciliation** — chart labels
resolution; last point reconciles to canonical spot. **Files:** `src/tracker/chart.js`. **Tests:**
e2e. **PR:** M. **P11 · Day-open / prev-close correctness** — verify change strip math. **Tests:**
unit. **PR:** S. **P12 · Monthly-baseline backfill with REAL data** — fill #589 template with real
LBMA monthlies (no fabrication). **Gate:** **owner data source.** **PR:** M.

## GROUP 3 — Core UX upgrades [dep groups 1–2 for numbers]

**P13 · Calculator handoff verify (#637) + polish** · **P14 · Calculator localized-input (flag OFF,
#600) verify+enable-plan** · **P15 · Portfolio add/edit/delete + P/L math audit** (multi-holding
fixtures) · **P16 · Compare per-country reconciliation vs canonical spot** · **P17 · Heatmap
per-country reconciliation

- legend/tooltip** · **P18 · Country/price responsive + empty-state QA.** Each: **Files**
  page-specific; **Tests** browser + (P15) unit P/L; **Risk** med (P15/P16/P17 touch numbers → must
  use canonical spot); **Flag/Gate** P14 flag OFF; **Owner** no; **PR** M; **Accept** numbers match
  canonical + no overflow + EN/AR/RTL.

## GROUP 4 — Multi-metal (gated OFF) [all verify; live = owner]

**P19–P24:** metals data-layer verify (#569/#570/#601–#606/#634) · per-metal freshness (#603) ·
metal+grade selector/URL (#604) · comparison render (#601/#605/#634) · per-metal SEO/JSON-LD (#606)
· **silver/Pt/Pd LIVE go-live** (per `docs/audits/2026-07-10_multimetal_golive_checklist.md`).
**Flag:** `METALS_PILOT_ENABLED` stays **false** for P19–P23. **Owner-decision:** **YES for P24**
(per-metal feed credentials + `gold-price-fetch.yml`). **Tests:** metals unit + render e2e
(pilot-OFF renders nothing). **Risk:** data (no fabrication). **PR:** M.

## GROUP 5 — Crypto comparison (gated OFF) [descriptive-only]

**P25–P30:** crypto plumbing verify (#573/#607) · gold-crypto correlation (descriptive, #574/#584,
correlation≠causation) · ratio/volatility framing (no predictions) · disclaimers verify · **crypto
data source decision** (real BTC/ETH; no fabrication) · **crypto MVP page (flag OFF)**. **Flag:**
`CRYPTO_PILOT_ENABLED` **false**. **Owner-decision:** **YES** P29/P30 (crypto feed). **Tests:**
unit + guard descriptive-only. **Risk:** trust (no forecasts). **PR:** M.

## GROUP 6 — Localization FR / HI / UR [verify + extend; linguist-gated content]

**P31–P36:** i18n architecture verify (#575) · FR pilot (#576) · HI pilot (#616) · UR pilot (#577) ·
RTL/`?lang=` correctness (#622/#624) extend to new surfaces · content-translation batches
(noindex-until-reviewed, #578/#588). **Owner-decision:** **YES** P36 (linguist review before
indexable). **Tests:** i18n parity + `lang-param`/`tracker-lang` e2e. **Risk:** RTL/parity. **PR:**
S–M. **[parallel-ok per locale]**.

## GROUP 7 — Growth & SEO [after core stable]

**P37–P42:** SEO head/canonical/hreflang verify (#627) · structured data (#613) + expand
(Article/FAQ/ LocalBusiness where valid) · sitemap/robots hygiene · internal linking / pSEO ·
landing pages (UAE/Dubai/24K/22K — metals landing gated on feed) · analytics events
**privacy-conscious** (**owner: analytics OAuth**). **Tests:** `seo-head` e2e + schema validation.
**Risk:** SEO/perf. **PR:** M. **[parallel-ok]**.

## GROUP 8 — Monetization (gated) [NOT live without owner approval]

**P43–P48:** RSS/JSON public feed (client $0 parts) · embed widget configurator ($0 frontend) ·
**premium tier** (ad-free/alerts/exports — **billing RED zone, owner**) · **public developer API**
(backend+billing, **owner**) · **white-label** (multi-tenancy, **owner**) · ads config (AdSense —
**owner**). **Newsletter #4 / WhatsApp #9 / Stripe #15 = EXCLUDED (owner-parked).**
**Owner-decision:** **YES** for P45–P48. **PR:** M–L.

## GROUP 9 — Apps & integrations [mostly gated]

**P49–P54:** PWA hardening verify (#579/#629) · **web push** (`sw.js` — **owner**) ·
Telegram/RSS/social automation (**owner** app+workflow) · Google-Sheets `=GOLDPRICE()` (backend —
**owner**) · native app (PWA-first; RN — **owner**) · descriptive AI market-analysis verify (#580,
no forecasts). **Owner-decision:** **YES** P50–P53. **Tests:** PWA e2e (offline). **Risk:**
ops/security. **PR:** M.

## GROUP 10 — Operations & governance [ongoing; some owner-only]

**P55 · Branch protection (F-13)** [**owner-only, settings not changed by agent**] — enable required
checks (lint/format/validate/build/unit/Playwright-chromium/pricing-invariant) + PR-required +
up-to-date + block force-push/deletion + dismiss-stale + conversation-resolution + restrict direct
pushes. **Owner-decision:** **YES.** **P56 · Security & privacy review** — client third-party fetch
inventory (F-1), CSP/headers, exposed keys, Supabase RLS (no weakening). **PR:** M. **P57 ·
Secrets/workflow governance verify** (#618 deny-list audited) · **P58 · Release/rollback +
observability verify** (#567; regression gate green pre-release) · **P59 · Dependency/CI hygiene**
(npm audit 0; keep) · **P60 · Docs/tracker canonical upkeep** (single tracker; audit/plan
cross-links current).

---

## Sequencing summary

- **Serial-critical first:** P1 → P2 (F-1 P0) → P7 → group-3 number phases (P15–P17 depend on P2).
- **Parallel-ok early:** P3, P4, P5, P6 (stabilization, file-disjoint).
- **Gated (await owner):** P2 source choice · P12 baseline data · P19-group P24 metals feed ·
  P29/P30 crypto feed · P36 linguist · group 8 monetization · P50-P53 integrations · **P55 branch
  protection.**
- **Never (owner-parked):** newsletter, WhatsApp, Stripe.

**Highest priority:** P1–P2 (F-1 P0) then P7–P9, then P4/P5/P9 stabilization, then group 3
reconciliation. Do NOT start execution until owner confirms Part V + the P2 source-of-truth and P55
branch-protection decisions.
