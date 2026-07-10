# Post-Convergence Main Audit — 2026-07-10 (CANONICAL)

> Canonical audit for the post-PR-convergence `main`. Supersedes/consolidates
> `docs/audits/2026-07-10_POST_MERGE_MASTER_AUDIT.md` (now a pointer to this file). Convergence
> ledger: `docs/audits/2026-07-10_PR_CONVERGENCE_REPORT.md`. Forward plan:
> `docs/plans/2026-07-10_CANONICAL_60_PHASE_POST_CONVERGENCE_PLAN.md`.

Runtime observations are point-in-time (2026-07-10), served from a local production `dist`
(`NODE_ENV=production` build + `stage-dist-statics` + `cp countries`, mirroring CI). Nothing is
marked "clean" unless exercised this session.

---

## 1. Executive summary

- **Main commit:** `eb246dea9` · **Tag:** `post-pr-convergence-pre-60-2026-07-10` (`6e600f5df`).
- **Backlog status:** **0 open PRs** — all 41 backlog PRs integrated (39 merged + #634
  orchestrator + #635 prettier-normalization = 41 merges); #615 closed-superseded (its live-site
  audit preserved as `docs/audits/2026-07-10_live-site-audit-cowork-b.md`).
- **Test status:** `npm test` **1574/0**; lint clean; `format:check` **0 warnings**; `validate` exit
  0; `npm audit` **0 vulnerabilities**; production build ✓; Playwright **Chromium 507/507** after
  the two Part-A e2e fixes (#636/#637).
- **Known remaining issues:** **F-1 (P0)** cross-surface spot inconsistency (client fetches live
  gold APIs); **F-13 (P1, governance)** `main` not branch-protected; **F-6 (P3)** Firefox-only
  tracker-flow flake under parallel load; **F-9 (P3)** `offline.html` missing `<main>`.
- **Any convergence regression?** **NO.** Every non-passing item was verified against the
  `pre-pr-convergence-2026-07-10` baseline tag and fails/behaves identically there. The convergence
  introduced zero regressions; invariants (AED 3.6725, troy 31.1035) untouched; all flags + pilots
  OFF; no fabricated data.

---

## 2. Pricing / data-integrity (FIRST)

Fixture `data/gold_price.json` `xau_usd_per_oz = 4107.7002` → canonical 24K AED/g =
`4107.70 / 31.1035 × 3.6725 = 485.01`; 24K USD/g = `132.07`; 22K AED/g = `444.59`.

- **Peg 3.6725 / troy 31.1035 / karat=÷24:** VERIFIED intact — pinned by
  `tests/pricing-invariants.test.js`, `tests/karat-formula.test.js` (#599),
  `tests/karatPurity.test.js` (#610). AED derived via the fixed peg, never the FX feed.
- **Spot vs retail separation:** VERIFIED — reference/estimate framing on every price surface; shops
  disclaimer explains the distinction (test corrected in #636 to assert the real in-disclaimer
  text).
- **No fabricated premiums / no fabricated XAG/XPT/XPD/BTC/ETH:** VERIFIED — `gold_price.json` is
  single-metal XAU; metals/crypto PRs added NO data files; retail premium is not invented.
- **No dormant pilots enabled:** VERIFIED — `METALS_PILOT_ENABLED=false`,
  `CRYPTO_PILOT_ENABLED=false`, and all 5 feature flags `false` (see §3).
- **Fallback/cached/live badges:** present (`FreshnessBadge` state + source + UTC) — BUT see F-1:
  the badge may label mutually-inconsistent values across surfaces.
- **Calculator:** formula EXACT — 10 g / 24K / AED → `4,867.82 د.إ`; per-gram `AED 485.01`; USD
  equiv exact (`calculator-accuracy.spec.js`). **Portfolio/shop/country:** localStorage-only
  holdings (device-local); shop/country numbers not exhaustively reconciled this pass (→ plan
  G39–G41).

### F-1 — Cross-surface spot inconsistency · **P0 · CONFIRMED · regression: NO (pre-existing)**

- **Evidence:** under one committed fixture (4107.70), three different spot values at the same
  instant — **calculator `$4,107.70 / 485.01`** (static file, exact); **home `$4,108.50 / 485.11`**;
  **tracker (clean storage) `$4,111.00 / 485.40`**. **Network capture on `tracker.html` shows
  client-side live fetches to `https://api.gold-api.com/price/XAU` (200) and
  `https://freegoldapi.com/data/latest.json` (200)** in addition to `/data/gold_price.json`.
- **Cause:** multiple price SOURCES with no single canonical resolution — tracker/home render a live
  external quote; calculator renders the hourly-committed file. Between commits they drift → the
  site shows different "current" gold prices on different surfaces. (Also a privacy surface: client
  hits gold-api/freegoldapi/Supabase/GA/Clarity/DoubleClick.)
- **Repro:**
  `NODE_ENV=production npm run build && node scripts/node/stage-dist-statics.js && cp -r countries dist/ && python3 -m http.server 8080 --directory dist &`
  then load `tracker.html` + `calculator.html` and compare the 24K AED/g; inspect network for
  `gold-api.com` / `freegoldapi.com`.
- **Recommended fix:** one `getCanonicalSpot()` resolver every surface reads (single value + single
  freshness state); decide "committed file vs live client API" as the source of truth. → Plan phases
  **7–12 (group 2)**, highest priority. **Owner decision:** which source is canonical.

---

## 3. Feature-flag audit

Source: `src/config/feature-flags.js`, `src/config/metals-flags.js`, `src/config/crypto-assets.js`.

| Flag                                  | Default   | Production-visible?                 |
| ------------------------------------- | --------- | ----------------------------------- |
| `CROSS_VALIDATION_ENABLED`            | **false** | no (preview via `?debug=true` only) |
| `LOCALIZED_NUMERAL_INPUT_ENABLED`     | **false** | no                                  |
| `FX_INTEGRITY_ENABLED`                | **false** | no                                  |
| `STALE_PRICE_GUARD_ENABLED`           | **false** | no                                  |
| `DATASOURCE_HEALTH_DASHBOARD_ENABLED` | **false** | no                                  |
| `METALS_PILOT_ENABLED`                | **false** | no (metal UI/data-layer dormant)    |
| `CRYPTO_PILOT_ENABLED`                | **false** | no (crypto snapshot dormant)        |

**Conclusion:** **all pilots/flags OFF, dormant-not-live, no hidden activation.** Every multi-metal
/ crypto code path is a flag _comparison_ (`=== true` guard), never an assignment.
`feature-flags.js` union conflict (from #591/#594/#596/#600) was resolved keeping every distinct
flag, all `false`.

---

## 4. UX / live-site audit

Exercised via the browser-guard suite (Chromium, prod dist) + targeted sweeps.

| Surface            | Result                                                                                                                             |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| Homepage           | renders; price surface labeled; **F-1** spot-source caveat                                                                         |
| Calculator         | formula exact; **handoff now visible on desktop after result (#637 fix, verified EN+AR, keyboard-focusable, 0 overflow)**          |
| Compare            | table renders rows + prices + add-control (`glossary-compare.spec.js`); per-country reconciliation → plan G40                      |
| Tracker            | renders; live badge/karat table/panels; **F-1** live-fetch spot; F-6 firefox flake                                                 |
| Shops              | 87 cards + filters; spot-vs-retail guidance in disclaimer (#636)                                                                   |
| Learn hub          | counter + progress + no `InvalidStateError` (`learn-progress.spec.js`)                                                             |
| Glossary           | 52 terms, all named+defined, EN+AR                                                                                                 |
| World heatmap      | 156 country shapes + legend + prices, 0 first-party console errors                                                                 |
| Mobile nav         | present all pages; **0 horizontal overflow** across {320,360,390,414} × EN/AR                                                      |
| EN/AR parity + RTL | `?lang=ar` → `dir=rtl lang=ar` first-load on all localized pages incl. tracker (#622/#624)                                         |
| Tap targets        | WCAG 2.2 pass (#619)                                                                                                               |
| a11y basics        | one `<h1>` / `<main>` / `<html lang>` / img-alt / named controls (14 pages) — **except `offline.html` missing `<main>` (F-9, P3)** |
| SEO basics         | 1 canonical (abs https) + 1 title + description + hreflang en/ar/x-default (`seo-head.spec.js`)                                    |
| PWA basics         | SW registers/activates; valid self-contained `offline.html` (`offline-pwa.spec.js`)                                                |
| Link integrity     | `check-links` all internal links resolve across 62 files                                                                           |

---

## 5. Testing audit (exact commands + counts)

| Command                                              | Result                                                                              |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `npm ci`                                             | 0                                                                                   |
| `npm audit`                                          | **0 vulnerabilities**                                                               |
| `npm run lint`                                       | clean (0)                                                                           |
| `npm run format:check`                               | **0 warnings** (after #635 normalization of 153 pre-existing)                       |
| `npm run validate`                                   | exit 0                                                                              |
| `npm test`                                           | **1574 pass / 0 fail**                                                              |
| `NODE_ENV=production npm run build`                  | ✓                                                                                   |
| `npx playwright test --project=chromium` (prod dist) | **507 pass / 0 fail** (after #636/#637)                                             |
| `npx playwright test --project=firefox` (prod dist)  | 168 pass / **1 flake** (F-6, tracker-flow under parallel load; passes in isolation) |
| `npx playwright test --project=webkit`               | pass (no unique failures)                                                           |

---

## 6. Known-issues table

| ID      | Area            | Severity | Regression?       | Evidence                                                                                        | Repro command                                                                                                                 | Recommended fix                                            | Status                  |
| ------- | --------------- | -------- | ----------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ----------------------- |
| F-1     | Pricing/data    | **P0**   | No (pre-existing) | 3 spot values same instant; net capture gold-api.com + freegoldapi.com                          | serve prod dist; load tracker+calculator; compare 24K AED/g; check network                                                    | single `getCanonicalSpot()` resolver; pick source of truth | **open → plan grp 2**   |
| F-13    | Governance      | P1       | No                | `gh api repos/vctb12/GoldTickerLive/branches/main/protection` → 404                             | same                                                                                                                          | enable branch protection (§7) — **owner-only**             | **open (owner)**        |
| F-6     | Testing/browser | P3       | No                | firefox tracker-flow.spec.js:71,:106 flake under parallel workers; pass in isolation + chromium | `npx playwright test tests/e2e/tracker-flow.spec.js --project=firefox` (pass) vs full `--project=firefox` (occasional 1 fail) | harden waits or mark firefox non-CI (CI is chromium-only)  | **documented**          |
| F-9     | a11y            | P3       | No                | `offline.html` has `<h1>` + content but no `<main>`                                             | load `/offline.html`; query `main`                                                                                            | add `<main>` landmark                                      | **open → plan grp 1/3** |
| (fixed) | Calculator UX   | P1       | No                | handoff 0×0 on desktop (mis-nested in display:none `.calc-flow`)                                | —                                                                                                                             | moved handoff out of `.calc-flow`                          | **RESOLVED #637**       |
| (fixed) | Testing         | —        | No                | shops asserted non-existent `spot-vs-retail` link                                               | —                                                                                                                             | assert in-disclaimer guidance                              | **RESOLVED #636**       |

**#637 acceptance re-verified (this session):** link visible after result (240×44 desktop / 332×44
mobile); **keyboard-focusable** (activeElement = `#calc-tracker-link`); stable id selector; **EN +
AR** text correct ("Compare this in tracker" / "قارن هذا في المتتبع", dir=rtl); **no layout shift /
0 horizontal overflow**; **no fabricated pricing/retail** injected (existing markup moved only);
Chromium coverage `calculator.spec.js:54`.

---

## 7. Branch-protection recommendation (DOCUMENT ONLY — NOT APPLIED)

`main` is currently **not protected** (F-13). Recommended settings (owner to apply in repo settings
— this agent did **not** change repo settings):

- **Require a pull request before merging** (no direct pushes to `main`).
- **Require status checks to pass:** lint, format:check, validate, build, unit tests (`npm test`),
  Playwright **Chromium** (minimum), and the pricing-invariant check (`pricing-invariants.test.js` /
  `karat-formula.test.js`).
- **Require branches to be up to date** before merging.
- **Block force pushes** to `main`.
- **Block branch deletion** of `main`.
- **Dismiss stale approvals** when new commits are pushed.
- **Require conversation resolution** before merging.
- **Restrict who can push** to `main` (no direct pushes; PR + checks only).
