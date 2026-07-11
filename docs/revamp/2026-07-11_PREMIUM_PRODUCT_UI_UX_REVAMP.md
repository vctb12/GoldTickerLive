# 2026-07-11 — Premium Product UI/UX/Interactivity/Dataviz/AI Revamp — Master Plan

**Status:** living · **Coordinator:** Premium Product Revamp session · **Companion docs:**
[`../agent/GOLDTICKERLIVE_REVAMP_STATE.md`](../agent/GOLDTICKERLIVE_REVAMP_STATE.md) (verified
current state) ·
[`../agent/GOLDTICKERLIVE_SKILL_ROUTING_MATRIX.md`](../agent/GOLDTICKERLIVE_SKILL_ROUTING_MATRIX.md)
(skill routing) · [`../AGENT_MASTER_TRACKER.md`](../AGENT_MASTER_TRACKER.md) (**canonical** phase
status — this plan does not duplicate it).

> This plan is deliberately honest, not aspirational. It maps the standing "premium revamp" charter
> onto the **actual** state of the repo, so effort goes to real gaps instead of rebuilding systems
> that already exist and pass their gates.

## 1. Executive diagnosis

Verified 2026-07-11 via `lint` + `validate` + `test` (all green) and Chromium renders of the core
surfaces in EN and AR at mobile + desktop widths (see the state doc for evidence).

### Strengths (already premium — preserve, don't rebuild)

- **Coherent design system**, not per-page styling: single token layer (`tokens.css` +
  `design-system.css`), one CSS barrel, self-hosted EN+AR fonts, cohesive dark mode with FOUC
  pre-init, JS-injected shared shell enforced by a CI guard.
- **Trust-first data layer**: canonical spot resolver + separate tracker multi-tier live engine,
  visible freshness labels (Live/Cached/Delayed/Fallback), explicit spot-vs-retail disclaimers, the
  AED 3.6725 peg and data sources disclosed on-surface. Offline/degraded states render honestly.
- **Genuine bilingual/RTL parity**: `?lang=ar` first-load renders full RTL, mirrored shell,
  localized titles/CTAs; 0 horizontal overflow at 390px across core pages; i18n leaked-key scan
  clean.
- **Strong engineering guardrails**: ~1400 unit tests, Playwright e2e in CI, DOM-safety gate,
  SEO/schema/hreflang/sitemap governance, a11y gate, analytics inventory.

### Weaknesses / real gaps (where new effort belongs)

- **Test coverage asymmetry:** the mobile no-overflow guard ran mostly in EN/LTR. _(Closed this
  session for the 6 core pages in AR; extend to remaining pages.)_
- **No formal ADRs:** foundational decisions live scattered across dozens of `docs/plans/*`; there
  is no `docs/adr/` index, so settled choices risk being re-litigated. (The prompt requires ADRs.)
- **Flagship offline-state polish:** possible duplicated freshness text in the fully-offline tracker
  state — needs confirm-intent vs. de-dupe.
- **Growth/AI surfaces** (alerts, signup, premium, API, white-label, AI explanations) remain
  owner-gated and largely unbuilt — correctly parked, not a foundation gap.
- **Docs sprawl:** many overlapping historical plans increase orientation cost; the state doc +
  routing matrix are the intended fast path.

## 2. Design direction (confirmation, already largely realized)

Restrained premium: warm parchment light / graphite dark, gold as a value-signal accent (never a
fill), Playfair display serif for editorial headings, Source Sans 3 tabular figures for data, Cairo
for Arabic. High density where users need data; spacious where they need comprehension. No
crypto-casino gold gradients, no over-animation, reduced-motion respected. This is the current
system — the job is consistency and polish, not reinvention.

## 3. Wave map (mapped to the canonical tracker, not a competing one)

| Wave | Theme                                                                                        | Real status here                                                   | Where tracked                                    |
| ---- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------ |
| 1    | Foundation + shell (tokens, type, theme, nav, search, footer, data-status, motion, a11y)     | **Largely done + green.** Residual: ADRs, test-coverage symmetry.  | canonical tracker (30-Revamp / tracker programs) |
| 2    | Highest-traffic surfaces (home, tracker, calculator, compare, portfolio)                     | **Shipped + premium.** Residual: flagship offline-state polish.    | canonical tracker                                |
| 3    | Market exploration (heatmap, country/market pages, history charts, tables)                   | Mostly shipped; incremental polish.                                | canonical tracker                                |
| 4    | Trust & education (methodology, learn, glossary, data-source docs)                           | Methodology redesign merged (#658); ongoing.                       | canonical tracker                                |
| 5    | Directory & conversion (shops, alerts, signup, newsletter, premium/API/white-label interest) | **Owner-gated**; parked.                                           | Owner-Gated Decision Queue                       |
| 6    | Advanced intelligence (AI explanations, NL search, scenario tools)                           | **Owner-gated** (paid AI/recurring cost); informational-only rule. | Owner-Gated Decision Queue                       |
| 7    | Growth & experimentation (SEO/AEO, structured data, CRO, A/B, launch)                        | Governance in place; campaign work gated on baseline metrics.      | canonical tracker + growth skills                |

## 4. Execution rules (this campaign)

- **One coordinator** owns plan/scope/dependency-map/shared-file locks/PR-ordering/gates/acceptance.
- **Verify before fixing.** Run `audit-reverify` (or a targeted check) before executing any older
  audit item — several documented bugs here are already closed. No no-op PRs.
- **Smallest correct change**, matching surrounding conventions; prefer minimal diffs.
- **File-disjoint parallelism only.** Shared shell/tokens/nav/search/footer/translations stay
  single-owner and sequential. Reserve a shared file before editing it.
- **Never** touch owner-gated surfaces except to audit; never push to `main`; never force-merge red
  CI; never introduce fake data/live claims/placeholder buttons; keep EN/AR semantic parity.
- **Autonomous on reversible details** (research → pick strongest → record → implement → verify);
  escalate only irreversible / legal / financial / peg-integrity / vendor-cost / hosting / auth /
  merge-authority decisions.

## 5. Definition of done (per phase)

Scope implemented · existing behavior preserved · data correct & traceable · EN+AR + RTL + mobile +
keyboard + reduced-motion + loading/error states all work · relevant gates green
(`lint`/`test`/`validate`/`build` + Playwright for interactive surfaces) · a11y checked (auto +
manual) · docs + canonical tracker updated · PR reviewable with honest What/Why/How/Proof/Risks ·
production verified when deployed · no unexplained console errors · no horizontal overflow · no fake
functionality.

## 6. This session's delivery (Wave-1 residual)

- **Shipped code:** `tests/e2e/rtl-mobile-overflow.spec.js` — CI-wired regression guard locking
  Arabic/RTL no-overflow + correct `dir`/`lang` at 390px for the 6 core surfaces (6/6 green in the
  Playwright runner). Closes the EN/LTR-only coverage asymmetry for those pages.
- **Governance:** verified state doc, skill-routing matrix, and this master plan. These docs
  cross-reference (link to) the canonical tracker; the tracker itself is left unedited on this
  branch per its own merge-conflict policy (it is maintained on `claude/revamp-master-tracker`).
- **Verification:** re-ran `lint`, `validate`, `test`, `build`; rendered EN/AR core pages; confirmed
  the prior DP-4b bug is already fixed (no no-op PR).

## 7. Recommended next PR (for owner sequencing)

Extend the RTL/mobile overflow guard to the remaining public pages (learn, glossary, market,
heatmap, portfolio, dubai-gold-price) — all verified overflow-free today — then seed `docs/adr/`
with ADRs codifying the tokens/typography/theme/shell/freshness/motion decisions so they stop being
re-litigated. Both are low-risk, high-durability, and file-disjoint from any in-progress flagship
work.
