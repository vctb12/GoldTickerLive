# Gold Ticker Live — Agent Master Tracker

**Last updated:** 2026-07-07 · **Updated by:** Claude Code **Purpose:** The single canonical source
of truth for **every plan and every phase** in this repository — finished and unfinished — so no
roadmap, phase, PR, decision, or skipped item is ever lost across sessions or context resets. This
file is **canonical over chat memory**.

> ⚠️ Do not create competing trackers. All phase status lives here.

## Update Rules (mandatory)

- **Check this file at the start of every session before any implementation.**
- Update it on **every** phase **start / finish / skip / block / PR**.
- **Session startup routine:** (1) read this file; (2) `git status` + confirm branch; (3) if `gh`
  available, `gh pr list --state open --limit 100` and `--state merged --limit 100`, else use the
  GitHub MCP tools; (4) reconcile PR links/statuses here; (5) pick the next `not-started` eligible
  phase; (6) if it is owner-gated, mark it `gated-pending-owner-decision`, add it to the Owner-Gated
  Decision Queue, and move to the next safe phase; (7) mark the selected phase `in-progress` before
  coding.
- **On start:** update _Last updated_, set the row to `in-progress`, update _Current Active Phase_,
  record the branch.
- **On finish:** set the row to `done`, add the PR, clear/refresh _Current Active Phase_, add to
  _Recently Opened PRs_, add a _Maintenance Log_ entry.
- **On skip/block:** never silently ignore — set `skipped` or `gated-pending-owner-decision`, add a
  one-line reason in _Scope/Blocker Note_, add to the _Owner-Gated Decision Queue_ if owner-gated,
  then continue to the next safe phase.
- **Branch reality:** the active program runs **one isolated branch + one PR per phase (no merge)**,
  so the tracker is maintained on its own branch/PR (`claude/revamp-master-tracker`) and refreshed
  at each checkpoint; per-phase PRs are cross-linked here rather than editing this file on every
  phase branch (that would conflict on merge).

## Status Legend

| Status                         | Meaning                                                                                                                                                                  |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `done`                         | Implementation/doc/audit phase has a PR opened, or work is already merged/shipped                                                                                        |
| `in-progress`                  | The current active branch/phase being worked                                                                                                                             |
| `skipped`                      | Intentionally skipped — already shipped, duplicate, unsafe, or superseded                                                                                                |
| `not-started`                  | Valid future work, no active PR yet                                                                                                                                      |
| `gated-pending-owner-decision` | Needs owner approval / paid infra / paid APIs / secrets / legal / billing / Supabase RLS/signup / production-workflow change / real multi-tenancy / native app / paid AI |

**PR field:** `#123 — URL` if a PR exists; `—` if none; `merged/shipped — PR unknown` if shipped
without a known PR; `owner decision required` if blocked by an owner decision.

## Global Guardrails (apply to every phase)

- **Never edit owner-gated surfaces** except to audit/recommend:
  `.github/workflows/gold-price-fetch.yml`, `.github/workflows/post_gold.yml`, billing config,
  Supabase RLS/signup config, `sw.js`.
- **Never resurrect** newsletter automation, WhatsApp Business API alerts, or Stripe/payments as
  active phases (parked by owner).
- **Never add** paid APIs / secrets / recurring infra / production provider switches / production
  X-Twitter workflow changes without owner approval.
- **AI / market analysis stays informational-only** — descriptive, backward-looking, rules-based;
  **never** investment advice or price predictions/forecasts.
- **Preserve** EN/AR semantic parity, RTL, freshness labels, the **AED 3.6725** peg, troy
  **31.1034768 g**, and reference-price (spot ≠ retail) wording.
- **No production DB writes** — migrations may be authored as files only.

## Current Active Phase

| Phase                                        | Branch                          | Status      | PR  | Notes                                     |
| -------------------------------------------- | ------------------------------- | ----------- | --- | ----------------------------------------- |
| Revamp Phase 17 — Design-token consolidation | `claude/revamp-phase-17-tokens` | in-progress | —   | hex->tokens; dual-theme visual-regression |
| Master Tracker (this doc)                    | `claude/revamp-master-tracker`  | in-progress | —   | Being created now                         |

---

## Master Phase Index

### A. Net-new 30-Phase Revamp — `docs/plans/2026-07-07_30-phase-revamp.md` (ACTIVE)

| Source    | Phase | Short Name                               | Status      | PR                                                       | Scope/Blocker Note                                      |
| --------- | ----- | ---------------------------------------- | ----------- | -------------------------------------------------------- | ------------------------------------------------------- |
| 30-Revamp | 1| Baseline & rollback fences               | done | #537                                                     | Plan, phase index, console harness, EN+AR baseline      |
| 30-Revamp | 2| Runtime error audit (register)           | done | #538                                                     | 0 uncaught errors; 6 items carried forward              |
| 30-Revamp | 3| Dependency/security/secrets audit        | done | #539                                                     | npm audit clean; S-2/S-3 owner-gated recs               |
| 30-Revamp | 4| Data-source resilience audit             | done | #541                                                     | Provider/fallback state diagram                         |
| 30-Revamp | 5| Spot-vs-retail hardening                 | done | #542                                                     | compare+heatmap AR trust-note parity fix                |
| 30-Revamp | 6| Unified freshness/fallback labeling      | done | #543                                                     | shops spot-bar vs ticker freshness bug fixed+verified   |
| 30-Revamp | 7| Methodology source-of-truth + deep links | done | #544                                                     | methodology parity exact; portfolio/calc deep-links     |
| 30-Revamp | 8| Secondary provider cross-validation      | done | #545                                                     | flagged OFF; +8 tests; enable = owner-gated             |
| 30-Revamp | 9| Metadata/canonical + icons/social        | done | #546                                                     | favicon 404 not-repro; twitter:site handle added        |
| 30-Revamp | 10| hreflang & bilingual SEO                 | done | #547                                                     | hreflang 14/14 reciprocal; AR-pre-render deferred       |
| 30-Revamp | 11| Structured data completion               | done | #548                                                     | methodology FAQPage schema via inject-schema            |
| 30-Revamp | 12| Sitemap gap closure                      | done | #549                                                     | sitemap complete; cleared stale governance.json         |
| 30-Revamp | 13| Internal linking & crawl                 | done | #550                                                     | no orphans; L-1/L-2/L-3 routed to owning phases         |
| 30-Revamp | 14| Core Web Vitals + perf script            | done | #551                                                     | npm run perf; all pages within budget; CLS<=0.016       |
| 30-Revamp | 15| Asset & image pipeline                   | done | #552                                                     | image pipeline best-practice; avif 5-56% savings        |
| 30-Revamp | 16| JS delivery + SW audit                   | done | #553                                                     | Leaflet already lazy; sw.js best-practice (owner-gated) |
| 30-Revamp | 17| Design-token consolidation               | done | #554                                                     | hex->tokens; dual-theme parity                          |
| 30-Revamp | 18| Global shell & navigation                | done | #555                                                     | Wire nav search to bilingual search                     |
| 30-Revamp | 19| Accessibility conformance                | done | #556                                                     | axe-core, AA contrast, keyboard/ARIA                    |
| 30-Revamp | 20| RTL & bilingual polish                   | done | #557                                                     | Logical props, bidi glyph (R-02)                        |
| 30-Revamp | 21| Homepage overhaul                        | done | #558                                                     | Visual-regression gated                                 |
| 30-Revamp | 22| Tracker page polish (in-place)           | done | #559                                                     | 99KB file; chart-vs-spot parity (R-04)                  |
| 30-Revamp | 23| Calculator UX + export/share             | done | #560                                                     | Reconcile PR #535                                       |
| 30-Revamp | 24| Compare tool (in-place)                  | done | #561                                                     | 74KB file                                               |
| 30-Revamp | 25| World heatmap polish                     | done | #562                                                     | Legend/keyboard/table fallback                          |
| 30-Revamp | 26| Portfolio tracker                        | done | #563                                                     | Preserve honest-gain rules + fixture                    |
| 30-Revamp | 27| Shops directory                          | done | #564                                                     | Data-quality badges, ItemList                           |
| 30-Revamp | 28| Learn hub & glossary + content lint      | done | #565                                                     | `scripts/content/` lint                                 |
| 30-Revamp | 29| Additive growth (flags only)             | done | #566                                                     | Embed/RSS/CSV behind flags; no billing                  |
| 30-Revamp | 30| Regression, rollout & observability      | done | #567                                                     | Smoke matrix, rollback plan                             |

### B. Continuation Phases 31–45 (roadmap-wishlist, same plan doc) — POST-30

| Source       | Phase | Short Name                            | Status      | PR  | Scope/Blocker Note                                                  |
| ------------ | ----- | ------------------------------------- | ----------- | --- | ------------------------------------------------------------------- |
| Continuation | 31| Heatmap spot/retail lens toggle       | done | #568 | Only genuinely-new heatmap delta (heatmap already shipped)          |
| Continuation | 32| Metals data-layer foundation (silver) | done | #569 | Verify gold-api.com XAG/XPT/XPD; gold math byte-identical           |
| Continuation | 33| Silver on tracker + calculator        | done | #570 | Metal switcher default gold                                         |
| Continuation | 34| Silver SEO + landing page             | in-progress | —   | New silver page + schema/sitemap                                    |
| Continuation | 35    | Platinum + Palladium rollout          | not-started | —   | Only after silver clean                                             |
| Continuation | 36    | Crypto price-history plumbing         | not-started | —   | BTC/USD (opt ETH) into history infra; no UI                         |
| Continuation | 37    | Gold-crypto correlation view          | not-started | —   | Correlation≠causation; NOT a prediction                             |
| Continuation | 38    | N-locale i18n scaffolding             | not-started | —   | EN/AR unchanged; de-risk refactor                                   |
| Continuation | 39    | French pilot UI                       | not-started | —   | Core pages, LTR                                                     |
| Continuation | 40    | Urdu pilot UI                         | not-started | —   | Reuse AR RTL infra                                                  |
| Continuation | 41    | Content translation policy + FR batch | not-started | —   | MT+human-review; no auto-only indexed                               |
| Continuation | 42    | PWA hardening/installability          | not-started | —   | 'mobile app' deliverable; RN out of scope; sw.js recommend-only     |
| Continuation | 43    | Descriptive market-analysis module    | not-started | —   | Template-based ai-drafts.js; no LLM; NO forecasts                   |
| Continuation | 44    | White-label static branding spike     | not-started | —   | Demo only; no tenants/billing                                       |
| Continuation | 45    | Decision brief (white-label/AI/RN)    | not-started | —   | docs-only                                                           |
| Continuation | 46    | Roadmap wishlist reconciliation       | not-started | —   | After 45; verify gold-api multi-metal, keep ai-drafts template-only |

### C. 50-Phase Master Plan — `docs/revamp/MASTER-50-PHASE-PLAN.md` (status from `docs/revamp/PROGRESS.md`)

> Note: the **20-Phase Audit Plan**
> (`docs/audits/MASTER_GOLDTICKERLIVE_WEBSITE_AUDIT_AND_20_PHASE_PLAN.md`) is the strategic **wave**
> grouping (Waves 0–7) of these same 50 phases — indexed in section D. Several of these overlap the
> net-new 30-Revamp; where so, the 30-Revamp phase is the active executor and the 50-plan row stays
> `not-started` (its own program) to avoid double-execution.

| Source  | Phase | Short Name                           | Status      | PR                                                       | Scope/Blocker Note                                        |
| ------- | ----- | ------------------------------------ | ----------- | -------------------------------------------------------- | --------------------------------------------------------- |
| 50-Plan | 00    | REPO-MAP                             | done        | #470 — https://github.com/vctb12/GoldTickerLive/pull/470 | Doc                                                       |
| 50-Plan | 01    | Regression safety net                | not-started | —                                                        |                                                           |
| 50-Plan | 02    | CI pipeline (build/lint/test)        | not-started | —                                                        | Largely already in `ci.yml`                               |
| 50-Plan | 03    | Design tokens single source          | not-started | —                                                        | Overlaps 30-Revamp #17                                    |
| 50-Plan | 04    | Lighthouse+a11y CI budget            | not-started | —                                                        | budget.json/lighthouserc shipped; overlaps #14/#19        |
| 50-Plan | 05    | Page/route inventory + audit map     | not-started | —                                                        |                                                           |
| 50-Plan | 06    | Canonical strategy normalization     | not-started | —                                                        | priority (P0 SEO); Overlaps 30-Revamp #9                  |
| 50-Plan | 07    | Distinct Arabic URLs (pre-render)    | not-started | —                                                        | priority (P0 SEO /ar/); Overlaps #10                      |
| 50-Plan | 08    | Localized titles & meta per locale   | not-started | —                                                        | priority; Overlaps #10                                    |
| 50-Plan | 09    | Reciprocal hreflang + x-default      | not-started | —                                                        | priority; Overlaps #10; reconcile PR #536                 |
| 50-Plan | 10    | XML sitemap locale alternates        | not-started | —                                                        | Overlaps #12; PR #536                                     |
| 50-Plan | 11    | robots.txt + indexing hygiene        | not-started | —                                                        | Overlaps #12                                              |
| 50-Plan | 12    | JSON-LD expansion & validation       | not-started | —                                                        | Overlaps #11                                              |
| 50-Plan | 13    | AR content parity sweep              | not-started | —                                                        | priority; Overlaps #10/#20                                |
| 50-Plan | 14    | Methodology localized + indexable    | not-started | —                                                        | priority; Overlaps #7                                     |
| 50-Plan | 15    | Freshness label thresholds           | not-started | —                                                        | Overlaps 30-Revamp #6 (R-01)                              |
| 50-Plan | 16    | Chart price reconciliation           | not-started | —                                                        | Overlaps #22 (R-04)                                       |
| 50-Plan | 17    | Unified freshness vocab + legend     | not-started | —                                                        | optional/low-value; Overlaps #6                           |
| 50-Plan | 18    | Quick-convert never blank            | done        | #474 — https://github.com/vctb12/GoldTickerLive/pull/474 | P1-5; overlaps #21                                        |
| 50-Plan | 19    | Spot-vs-retail trust chip sitewide   | not-started | —                                                        | Overlaps #5                                               |
| 50-Plan | 20    | Methodology copy de-jargon           | not-started | —                                                        | editorial; P2-4                                           |
| 50-Plan | 21    | Disclaimer/"not retail" consistency  | not-started | —                                                        | Overlaps #5                                               |
| 50-Plan | 22    | Stale/unavailable visual states      | not-started | —                                                        | Overlaps #6                                               |
| 50-Plan | 23    | Header nav breakpoint (logo overlap) | skipped     | —                                                        | Deferred in PROGRESS: not reproducible at testable widths |
| 50-Plan | 24    | Mobile header & ticker density       | not-started | —                                                        | Overlaps #18/#21                                          |
| 50-Plan | 25    | Tracker-handoff layout rebalance     | not-started | —                                                        | R-03; overlaps #23                                        |
| 50-Plan | 26    | Bidi isolation mixed EN/AR           | not-started | —                                                        | optional; R-02; overlaps #20                              |
| 50-Plan | 27    | Repeated checklist headings          | done        | #471 — https://github.com/vctb12/GoldTickerLive/pull/471 | P2-3                                                      |
| 50-Plan | 28    | Country/price responsive QA          | not-started | —                                                        |                                                           |
| 50-Plan | 29    | Theme toggle correctness             | not-started | —                                                        |                                                           |
| 50-Plan | 30    | CLS hardening                        | not-started | —                                                        | Overlaps #14/#15                                          |
| 50-Plan | 31    | Light-mode contrast fix              | not-started | —                                                        | P1-4; overlaps #19                                        |
| 50-Plan | 32    | Focus states & keyboard nav          | not-started | —                                                        | Overlaps #19                                              |
| 50-Plan | 33    | Semantic structure & landmarks       | not-started | —                                                        | Overlaps #19                                              |
| 50-Plan | 34    | SR pass for live prices              | not-started | —                                                        | Overlaps #19                                              |
| 50-Plan | 35    | Reduced motion hygiene               | not-started | —                                                        | Overlaps #19                                              |
| 50-Plan | 36    | Alt text & non-text content          | not-started | —                                                        | Overlaps #19                                              |
| 50-Plan | 37    | Bundle consolidation                 | not-started | —                                                        | optional/subjective; Overlaps #16                         |
| 50-Plan | 38    | favicon & PWA icon fix               | not-started | —                                                        | Overlaps #9/#42                                           |
| 50-Plan | 39    | Font loading optimization            | not-started | —                                                        | Overlaps #14/#15                                          |
| 50-Plan | 40    | Image & hero optimization            | not-started | —                                                        | Overlaps #15                                              |
| 50-Plan | 41    | Caching, headers & SW                | not-started | —                                                        | `sw.js` owner-gated; overlaps #16                         |
| 50-Plan | 42    | Analytics & consent (privacy-safe)   | not-started | —                                                        |                                                           |
| 50-Plan | 43    | Brand/OG social images               | not-started | —                                                        | Overlaps #9                                               |
| 50-Plan | 44    | Hero & section imagery refresh       | not-started | —                                                        | Overlaps #15/#21                                          |
| 50-Plan | 45    | Micro-interactions & motion polish   | not-started | —                                                        | Overlaps #21                                              |
| 50-Plan | 46    | Dark-mode visual QA                  | not-started | —                                                        | Overlaps #17                                              |
| 50-Plan | 47    | Iconography & visual consistency     | not-started | —                                                        |                                                           |
| 50-Plan | 48    | Internal linking & pSEO QA           | not-started | —                                                        | Overlaps #13                                              |
| 50-Plan | 49    | Full bilingual regression gate       | not-started | —                                                        | Overlaps #30                                              |
| 50-Plan | 50    | Launch, monitoring & docs            | not-started | —                                                        | Overlaps #30                                              |

### D. 20-Phase Audit Plan (Waves) — `docs/audits/MASTER_GOLDTICKERLIVE_WEBSITE_AUDIT_AND_20_PHASE_PLAN.md`

| Source      | Wave         | Short Name                                                                         | Status      | PR  | Scope/Blocker Note                  |
| ----------- | ------------ | ---------------------------------------------------------------------------------- | ----------- | --- | ----------------------------------- |
| Audit-Waves | 0 (ph 1–5)   | Foundation: tests, CI, tokens, budgets, inventory                                  | not-started | —   | Strategic grouping of 50-Plan 01–05 |
| Audit-Waves | 1 (ph 6–14)  | SEO/i18n: canonical, /ar/, meta, hreflang, sitemap, JSON-LD, parity, methodology   | not-started | —   | Overlaps 30-Revamp #9–#12           |
| Audit-Waves | 2 (ph 15–22) | Trust: freshness, chart reconc., quick-convert, chip, disclaimers, degraded states | not-started | —   | Overlaps 30-Revamp #5–#7            |
| Audit-Waves | 3 (ph 23–30) | Responsive/UX: nav breakpoint, header, handoff, bidi, headings, CLS                | not-started | —   | Overlaps #18/#20/#21                |
| Audit-Waves | 4 (ph 31–36) | A11y: contrast, focus, semantics, SR, motion, alt                                  | not-started | —   | Overlaps #19                        |
| Audit-Waves | 5 (ph 37–42) | Perf: bundle, icons, fonts, images, caching/SW, analytics                          | not-started | —   | Overlaps #14–#16                    |
| Audit-Waves | 6 (ph 43–47) | Visual: OG, hero, motion, dark-mode, iconography                                   | not-started | —   | Overlaps #15/#17/#21                |
| Audit-Waves | 7 (ph 48–50) | Launch: linking/pSEO QA, bilingual gate, monitoring/docs                           | not-started | —   | Overlaps #13/#30                    |

### E. Product Roadmap (21 items) — `docs/plans/2026-07-04_product-roadmap.md`

| Source  | Item | Short Name                                 | Status                       | PR                          | Scope/Blocker Note                                                            |
| ------- | ---- | ------------------------------------------ | ---------------------------- | --------------------------- | ----------------------------------------------------------------------------- |
| Roadmap | 1    | Multi-source price cross-validation (T1.1) | gated-pending-owner-decision | owner decision required     | `gold-price-fetch.yml` production-critical                                    |
| Roadmap | 2    | Silver/Platinum/Palladium expansion        | not-started                  | —                           | $0 via gold-api.com; UI doable (30-Revamp #32–35); workflow edits owner-gated |
| Roadmap | 3    | Premium tier (ad-free)                     | gated-pending-owner-decision | owner decision required     | Billing RED zone + Supabase RLS                                               |
| Roadmap | 4    | Email newsletter automation                | skipped                      | —                           | REMOVED by owner — do not build                                               |
| Roadmap | 5    | Instagram + LinkedIn post automation       | gated-pending-owner-decision | owner decision required     | App approvals + new workflows owner-gated; $0-API rule                        |
| Roadmap | 6    | Portfolio tracker                          | done                         | merged/shipped — PR unknown | Shipped 2026-07-04 `portfolio.html`                                           |
| Roadmap | 7    | Interactive world heatmap                  | done                         | merged/shipped — PR unknown | Shipped 2026-07-04 `heatmap.html`                                             |
| Roadmap | 8    | Crypto–gold correlation tracker            | not-started                  | —                           | Overlaps 30-Revamp #36–37; needs crypto source + trust framing                |
| Roadmap | 9    | WhatsApp Business API alerts               | skipped                      | —                           | PARKED (owner, $0 rule); Telegram/RSS/Web Push substitute                     |
| Roadmap | 10   | Google Sheets `=GOLDPRICE()`               | gated-pending-owner-decision | owner decision required     | Interim docs shipped; real add-on blocked on backend                          |
| Roadmap | 11   | Web Push notifications                     | gated-pending-owner-decision | owner decision required     | `sw.js` owner-gated (VAPID is $0)                                             |
| Roadmap | 12   | Multi-language FR/UR/HI                    | not-started                  | —                           | Overlaps 30-Revamp #38–41; linguist review required                           |
| Roadmap | 13   | Premium developer API                      | gated-pending-owner-decision | owner decision required     | Backend enablement + billing RED zone                                         |
| Roadmap | 14   | White-label for dealers                    | gated-pending-owner-decision | owner decision required     | Real multi-tenancy owner-gated; embed configurator ($0) = 30-Revamp #44       |
| Roadmap | 15   | Stripe payment for ordering                | skipped                      | —                           | PARKED (owner); legal/KYC + RED zone                                          |
| Roadmap | 16   | Mobile app (PWA or React Native)           | not-started                  | —                           | PWA = 30-Revamp #42; RN owner-gated                                           |
| Roadmap | 17   | AI market analysis / predictions           | not-started                  | —                           | Descriptive-only = 30-Revamp #43; predictions forbidden                       |
| Roadmap | 18   | Telegram channel automation                | gated-pending-owner-decision | owner decision required     | Free API but new workflow + secret owner-gated                                |
| Roadmap | 19   | Repo-committed daily price history         | gated-pending-owner-decision | owner decision required     | `gold-price-fetch.yml` edit owner-gated                                       |
| Roadmap | 20   | Public RSS + JSON price feed               | not-started                  | —                           | Overlaps 30-Revamp #29 (client-generated parts $0)                            |
| Roadmap | 21   | Embed widget configurator                  | not-started                  | —                           | Overlaps 30-Revamp #29/#44; pure frontend                                     |

---

## Owner-Gated Decision Queue

| Item                                | Source               | What's needed from owner                                                                    |
| ----------------------------------- | -------------------- | ------------------------------------------------------------------------------------------- |
| Security header edge delivery (S-2) | 30-Revamp #3 report  | Front site with Cloudflare free tier to ship `_headers` (CSP/HSTS/framing)                  |
| RLS migration 004 (S-3)             | 30-Revamp #3 report  | Apply staged `004_prisma_comparison_enable_rls.sql` to production DB                        |
| Secondary provider go-live          | 30-Revamp #8         | Approve enabling cross-validation in production `gold-price-fetch.yml`                      |
| Metals provider workflow            | Roadmap #2           | Approve `gold-price-fetch.yml` edits to fetch XAG/XPT/XPD (data-layer/UI can proceed at $0) |
| Premium tier / billing              | Roadmap #3, #13, #15 | Billing RED zone + Supabase signups decision                                                |
| Social automations                  | Roadmap #5, #18      | App approvals + new workflows + secrets                                                     |
| Web Push / SW                       | Roadmap #11, #19     | `sw.js` + `gold-price-fetch.yml` edits                                                      |
| White-label multi-tenancy           | Roadmap #14          | Commercial/licensing terms (spike + brief are $0)                                           |
| React Native app                    | Roadmap #16          | Developer program fees + second codebase decision                                           |
| AI predictions engine               | Roadmap #17          | Forbidden as forecasts; owner gate for anything beyond descriptive                          |

## Recently Opened PRs

| PR   | Phase          | Title                                             | Opened     |
| ---- | -------------- | ------------------------------------------------- | ---------- |
| #537 | 30-Revamp 1    | Baseline & rollback fences                        | 2026-07-07 |
| #538 | 30-Revamp 2    | Runtime error audit & defect register             | 2026-07-07 |
| #539 | 30-Revamp 3    | Dependency/security/secrets audit + CSP inventory | 2026-07-07 |
| #540 | Master Tracker | Canonical cross-plan tracker                      | 2026-07-07 |
| #541 | 30-Revamp 4    | Data-source resilience map + state diagram        | 2026-07-07 |
| #542 | 30-Revamp 5    | Spot-vs-retail parity fix (compare+heatmap)       | 2026-07-07 |
| #543 | 30-Revamp 6    | Shops spot-bar vs ticker freshness fix            | 2026-07-07 |
| #544 | 30-Revamp 7    | Methodology parity + tool deep-links              | 2026-07-07 |
| #545 | 30-Revamp 8    | Secondary-provider cross-validation (flagged)     | 2026-07-07 |

## Skipped / Superseded Items

| Item                              | Source      | Reason                                         |
| --------------------------------- | ----------- | ---------------------------------------------- |
| Newsletter automation             | Roadmap #4  | Removed by owner                               |
| WhatsApp Business API alerts      | Roadmap #9  | Parked ($0 rule); substitutes exist            |
| Stripe payment for ordering       | Roadmap #15 | Parked (legal/KYC + RED zone)                  |
| 50-Plan Phase 23 (nav breakpoint) | 50-Plan     | Deferred — not reproducible at testable widths |

## Maintenance Log

| Date       | Actor       | Change                                                                                                                                                                                                  |
| ---------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-07-07 | Claude Code | Created tracker; indexed 30-Revamp (1–30) + continuation (31–46) + 50-Plan (00–50) + Audit Waves (0–7) + Roadmap (1–21). Phases 1–3 done (#537/#538/#539); Phase 4 in-progress.                         |
| 2026-07-07 | Claude Code | Phase 4 done (#541), Phase 5 done (#542, compare+heatmap AR trust-note parity); tracker PR #540. Phase 6 in-progress.                                                                                   |
| 2026-07-07 | Claude Code | Track B complete: Phase 6 (#543 shops freshness bug fixed+verified), 7 (#544 methodology parity), 8 (#545 cross-validation flagged). Rows 1-9 status reconciled. Suite 1286->1294. Phase 9 in-progress. |
| 2026-07-07 | Claude Code | Track C complete: Phase 9 (#546 twitter:site), 10 (#547 hreflang audit), 11 (#548 methodology FAQPage), 12 (#549 sitemap+governance), 13 (#550 linking audit). Phase 14 in-progress.                    |
| 2026-07-07 | Claude Code | Track D complete: Phase 14 (#551 perf runner npm run perf), 15 (#552 image audit), 16 (#553 JS/SW audit). Phase 17 in-progress.                                                                         |
