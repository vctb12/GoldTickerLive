# Post-Merge Master Audit — 2026-07-10

**Auditor:** Claude Code (sole coordinator) · **State:** post-PR-convergence `main` (`cb7f14433`),
open backlog = 0, tag `post-pr-convergence-pre-60-2026-07-10`. **Scope this pass:** (A)
pricing/data-integrity across every surface that shows a number, and (B) a live-site browser matrix.
Findings use the required format. **Nothing is marked "clean" unless actually exercised this
session.** Runtime observations are point-in-time (2026-07-10) and served from a local production
`dist` (`NODE_ENV=production` build + `stage-dist-statics` + `cp countries`, mirroring CI); where a
result may differ in true production it is flagged for re-test.

---

## 0. Verification run (VERIFIED this session)

| Gate                                              | Result                                                                                                                                                                              |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm ci` / `npm audit`                            | clean / **0 vulnerabilities**                                                                                                                                                       |
| `npm run lint` · `format:check` · `validate`      | clean · **0 warnings** · exit 0                                                                                                                                                     |
| unit tests                                        | **1574 / 0**                                                                                                                                                                        |
| production build                                  | ✓                                                                                                                                                                                   |
| Playwright (chromium/firefox/webkit vs prod dist) | **507/507 chromium** after the 2 Part-III fixes (#636/#637); 2 firefox-only tracker items remain (F-6)                                                                              |
| Immutable invariants                              | `AED_PEG` **3.6725**, `TROY_OZ_GRAMS` **31.1035** untouched; all 5 feature flags **false**; metals+crypto pilots **false**; `gold_price.json` single-metal XAU (no fabricated data) |

---

## A. Pricing / data-integrity findings

Fixture: `data/gold_price.json` `xau_usd_per_oz = 4107.7002` → canonical 24K AED/g =
`4107.70 / 31.1035 × 3.6725 = 485.01`; 24K USD/g = `132.07`; 22K AED/g = `444.59`.

### F-1 — Cross-surface spot value divergence · **P0 (pending prod re-test → possibly P1)**

- **status:** reproduced (local prod-dist); root cause NOT isolated this session.
- **page/module:** home (`index.html`), tracker (`tracker.html`), calculator (`calculator.html`);
  price layer `src/lib/api.js`, `src/components/spotBar.js`, `src/tracker/*`.
- **steps:** build+stage prod dist (single `data/gold_price.json` = 4107.70), serve, load each
  surface, read the XAU/USD spot + 24K AED/g within the same few seconds.
- **expected:** every surface shows the SAME spot (4107.70) and 24K AED/g (485.01) — one canonical
  number at one instant, each with its own freshness label.
- **actual:** **calculator 4107.70 / 485.01** (matches file, exact); **home 4108.50 / 485.11**;
  **tracker (clean storage) 4111.00 / 485.40** — three different spot values simultaneously.
- **evidence:** cross-surface sweep output 2026-07-10 (calc `AED 485.01` / `$4,107.70`; tracker text
  `XAU/USD $4,108.50 | 24K AED/g 485.11`; clean-storage tracker `4,111.00 / 485.40`).
- **suspected cause:** all client code reads `/data/gold_price.json` (`api.js:111`,
  `tracker-pro.js:1470`), so variance is NOT from the committed file. Candidates: (a) localStorage
  cache preferred over fresh file on some surfaces (`api.js:234 cached.price`); (b) a background
  hourly `chore(data): refresh gold price` commit rewriting the file mid-test; (c) an un-isolated
  live/secondary path. Requires a controlled prod-load re-test (no cache, no concurrent data commit)
  to confirm P0 vs local artifact.
- **fix:** single canonical spot-resolution shared by ALL surfaces (one value + one freshness state
  per render), with a test asserting home/tracker/calculator/portfolio/compare/heatmap agree on the
  24K figure under one fixture. **60-phase destination:** Theme A (Canonical pricing & trust, 1–6).
- **owner gate:** none to investigate; none to fix (client-only).

### F-2 — Calculator numeric formula is exact · **PASS (verified)**

- 10 g / 24K / AED → `4,867.82 د.إ`; per-gram badge `AED 485.01` = `xau/31.1035 × 3.6725`; USD equiv
  exact. Locked by `tests/e2e/calculator-accuracy.spec.js` + `tests/pricing-invariants.test.js`.

### F-3 — Freshness labeling present on price surfaces · **PASS (verified)**

- Home + tracker render a `FreshnessBadge` with state + `Source: Gold-API.com` + UTC timestamp (AR
  localized). Locked by `tests/e2e/freshness-labels.spec.js`. NOTE: given F-1, freshness labels
  exist but may not reconcile the DIFFERING values across surfaces — fold into F-1's fix.

### F-4 — Spot ≠ retail framing present · **PASS (verified)**

- Reference/estimate framing on every price surface; shops disclaimer explains spot-vs-retail (test
  corrected in #636 to assert the real in-disclaimer location).

### F-5 — Peg / troy / karat invariants · **PASS (verified)**

- `AED_PEG 3.6725`, `TROY_OZ_GRAMS 31.1035`, karat purity = code/24 — pinned by
  `tests/pricing-invariants.test.js`, `tests/karat-formula.test.js` (#599),
  `tests/karatPurity.test.js` (#610). AED derived via fixed peg, never the FX feed.

---

## B. Live-site browser matrix findings

Exercised via the browser-guard suite (chromium, prod dist) + targeted sweeps this session.

### F-6 — Firefox-only tracker-flow failures · **P3 (browser parity)**

- **status:** reproduced (firefox only); CI runs chromium only (`ci.yml`).
- **page:** `tracker.html` — `tracker-flow.spec.js:71` (method tab), `:106` (command-center panels).
- **expected/actual:** panels/tab assert visible; pass in chromium/webkit, fail in firefox
  (timing/render). **evidence:** matrix run 2026-07-10 (8 failed → 2 firefox after F-1-adjacent
  fixes).
- **cause:** firefox-specific hydration timing; not gated by CI. **fix:** stabilize the specs
  (deterministic waits) or document firefox as unsupported for e2e. **60-phase:** Theme D
  (Design/responsive/a11y) or F backbone (verification). **owner gate:** none.

### F-7 — Console / network cleanliness · **PASS (verified)**

- 14 core pages EN+AR: zero first-party console errors, zero same-origin 4xx
  (`tests/e2e/console-clean.spec.js`). Cross-origin analytics/Supabase handled with fallbacks.

### F-8 — RTL / `?lang=` on first load · **PASS (verified, fixed in convergence)**

- 13 pages + tracker: `?lang=ar` → `dir=rtl lang=ar` on first load (#622/#624). Guards:
  `lang-param.spec.js`, `tracker-lang.spec.js`.

### F-9 — Accessibility baseline · **PASS (verified)**

- 14 pages hydrated: one `<h1>`, `<main>`, `<html lang>`, img alt, named controls
  (`a11y-baseline.spec.js`). NOTE: `offline.html` lacks a `<main>` (minor) — **P3**, Theme D.

### F-10 — SEO head, theme, offline/PWA · **PASS (verified)**

- canonical/title/hreflang (`seo-head.spec.js`); theme FOUC-safe + persists
  (`theme-toggle.spec.js`); SW active + valid `offline.html` (`offline-pwa.spec.js`).

### F-11 — Calculator handoff (fixed this session) · **RESOLVED (#637)**

- Was: post-result CTA invisible on desktop (mis-nested in `display:none` `.calc-flow`). Fixed by
  moving it out; verified visible 240×44 @1280 / 332×44 @390, no overflow.

### F-12 — Mobile overflow · **PASS (verified)**

- 0 horizontal overflow across core pages × {320,360,390,414} × EN/AR.

---

## C. Governance finding

### F-13 — `main` is not branch-protected · **P1 (governance) — OWNER DECISION**

- **status:** verified (`branches/main/protection` → 404 "Branch not protected").
- **impact:** no required status checks — PRs (incl. failing `quality`/format/e2e) could always
  merge; this is why 153 format warnings + 2 e2e reds accumulated pre-convergence. Also allows
  direct pushes to `main`.
- **fix (owner-only, NOT changed per instruction):** enable branch protection requiring the CI
  job(s) (`ci.yml` quality + Playwright chromium) + at least the merge-queue checks; disallow direct
  pushes.
- **owner gate:** YES — repo settings are the owner's decision (explicitly deferred).

---

## D. Not-yet-exhaustively-tested (honest gaps for continued audit)

The full matrix (device × locale × **light/dark** × **reduced-motion** × **slow/offline** network ×
fresh/returning storage × valid/stale/failed/empty data) was sampled, not exhaustively run. Still to
do (→ Part IV phases): per-country pages price reconciliation vs home/tracker under one fixture;
portfolio P/L math under multi-holding fixtures; compare/heatmap per-country number reconciliation;
degraded-data states (stale/failed/empty) visual + labeling; slow-3G + offline first-paint;
dark-mode contrast across the new metal/crypto (flag-OFF) surfaces.

## Severity summary

| P0                         | P1              | P2  | P3                                |
| -------------------------- | --------------- | --- | --------------------------------- |
| F-1 (pending prod re-test) | F-13 governance | —   | F-6 firefox, F-9 offline `<main>` |

**Top priority: F-1** (cross-surface spot divergence) → Theme A. **F-13** (branch protection) is an
owner decision.
